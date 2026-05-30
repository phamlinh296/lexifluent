package org.linh.lexi.ai.orchestration;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.ai.domain.AiFeedbackEntity;
import org.linh.lexi.ai.domain.AiRequestEntity;
import org.linh.lexi.ai.domain.AiRequestStatus;
import org.linh.lexi.ai.event.AiFeedbackGeneratedMessage;
import org.linh.lexi.ai.classification.ClassificationEngine;
import org.linh.lexi.ai.classification.WritingClassification;
import org.linh.lexi.ai.provider.AiCompletion;
import org.linh.lexi.ai.provider.AiProviderRouter;
import org.linh.lexi.ai.provider.AiProviderType;
import org.linh.lexi.ai.provider.AiRequest;
import org.linh.lexi.ai.prompt.PromptComposer;
import org.linh.lexi.ai.repository.AiFeedbackRepository;
import org.linh.lexi.ai.repository.AiRequestRepository;
import org.linh.lexi.ai.schema.AiFeedbackSchema;
import org.linh.lexi.ai.schema.AnalysisSchema;
import org.linh.lexi.ai.schema.AiFeedbackSchemaValidator;
import org.linh.lexi.ai.schema.TransformationSchema;
import org.linh.lexi.ai.usage.AiUsageTracker;
import org.linh.lexi.analytics.dto.FeedbackAnalyticsSnapshot;
import org.linh.lexi.analytics.service.AnalyticsService;
import org.linh.lexi.common.config.KafkaTopics;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.linh.lexi.review.service.MistakeTrackerService;
import org.linh.lexi.user.util.UserApiKeyEncryptor;
import org.linh.lexi.writing.domain.WritingEntry;
import org.linh.lexi.writing.domain.WritingMode;
import org.linh.lexi.writing.event.WritingSubmittedMessage;
import org.linh.lexi.writing.repository.WritingEntryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiOrchestrationService {

    private final AiProviderRouter providerRouter;
    private final PromptComposer promptComposer;
    private final ClassificationEngine classificationEngine;
    private final AiFeedbackSchemaValidator schemaValidator;
    private final AiRequestRepository aiRequestRepository;
    private final AiFeedbackRepository aiFeedbackRepository;
    private final WritingEntryRepository writingEntryRepository;
    private final AiUsageTracker usageTracker;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final UserApiKeyEncryptor encryptor;
    private final AiFailureMarkingService failureMarkingService;
    private final AnalyticsService analyticsService;
    private final MistakeTrackerService mistakeTrackerService;

    @Value("${lexi.ai.cheap-model:gemini-2.5-flash}")
    private String cheapModel;

    @Value("${lexi.ai.strong-model:gemini-2.5-flash}")
    private String strongModel;

    @Transactional
    @Retry(name = "aiOrchestration")
    public UUID processWriting(WritingSubmittedMessage message) {
        WritingEntry entry = writingEntryRepository.findById(message.writingEntryId())
                .orElseThrow(() -> new IllegalStateException("WritingEntry not found: " + message.writingEntryId()));

        entry.markProcessing();
        writingEntryRepository.save(entry);

        boolean isIelts = entry.getMode() != WritingMode.DAILY_ENGLISH;
        boolean useStrong = isIelts && entry.getCorrectionStyle().name().endsWith("7_8");
        String model = useStrong ? strongModel : cheapModel;

        AiRequestEntity primaryRequest = AiRequestEntity.builder()
                .userId(message.userId())
                .writingEntryId(entry.getId())
                .provider(providerRouter.getDefaultProviderType())
                .model(model)
                .callNumber(isIelts ? 1 : null)
                .build();
        aiRequestRepository.save(primaryRequest);

        long start = System.currentTimeMillis();
        try {
            usageTracker.checkQuota(message.userId());

            String cefrLevel = entry.getUser().getCefrLevel() != null
                    ? entry.getUser().getCefrLevel().name() : null;
            // Scoring prompt omits CEFR level — examiner scores the writing, not the writer's profile
            String scoringPrompt = promptComposer.buildUserPrompt(
                    entry.getOriginalText(), entry.getTopicPrompt(), null);
            String transformPrompt = promptComposer.buildUserPrompt(
                    entry.getOriginalText(), entry.getTopicPrompt(), cefrLevel);

            WritingClassification classification = classificationEngine.classify(
                    entry, entry.getCorrectionStyle(), message.userId());

            AiFeedbackEntity feedback = isIelts
                    ? executeIeltsPipeline(entry, message.userId(), model, useStrong, scoringPrompt, transformPrompt, classification, primaryRequest, start)
                    : executeDailyPipeline(entry, message.userId(), model, transformPrompt, classification, primaryRequest, start);

            entry.markProcessed();
            writingEntryRepository.save(entry);

            triggerPostProcessing(message.userId(), entry, feedback);
            return feedback.getId();

        } catch (Exception ex) {
            log.error("AI processing failed for entry {}: {}", entry.getId(), ex.getMessage(), ex);
            int latencyMs = (int) (System.currentTimeMillis() - start);
            failureMarkingService.markFailed(entry.getId(), primaryRequest, ex.getMessage(), latencyMs);
            throw ex;
        }
    }

    public void publishVocabularyEvent(UUID writingEntryId, UUID feedbackId, UUID userId) {
        try {
            kafkaTemplate.send(
                    KafkaTopics.AI_FEEDBACK_GENERATED,
                    writingEntryId.toString(),
                    new AiFeedbackGeneratedMessage(writingEntryId, feedbackId, userId)
            );
        } catch (Exception ex) {
            log.warn("Kafka unavailable, vocabulary extraction skipped for entry {}: {}", writingEntryId, ex.getMessage());
        }
    }

    // IELTS: 2 calls — scoring first, transformation second
    // Separated so the examiner scores the raw text, not the model's own rewrites
    private AiFeedbackEntity executeIeltsPipeline(WritingEntry entry, UUID userId, String model, boolean useStrong,
                                                   String scoringPrompt, String transformPrompt,
                                                   WritingClassification classification,
                                                   AiRequestEntity scoringRequest, long globalStart) {
        // Call 1: Scoring — no CEFR level, no band target, no user history (blind evaluation)
        String scoringSystem = promptComposer.buildScoringSystemPrompt(classification);
        AiRequest call1 = useStrong
                ? AiRequest.strong(scoringSystem, scoringPrompt, model)
                : AiRequest.cheap(scoringSystem, scoringPrompt, model);

        AiCompletion scoringCompletion;
        AnalysisSchema analysis;
        try {
            scoringCompletion = routeWithByok(entry, call1);
            analysis = schemaValidator.parseAndValidateAnalysis(scoringCompletion.getContent());
        } catch (LexiException ex) {
            if (ex.getErrorCode() != ErrorCode.AI_RESPONSE_INVALID) throw ex;
            log.warn("Call 1 schema violation for entry {}, retrying: {}", entry.getId(), ex.getMessage());
            String retryPrompt = promptComposer.buildSchemaRetryUserPrompt(scoringPrompt, ex.getMessage());
            scoringCompletion = routeWithByok(entry, AiRequest.cheap(scoringSystem, retryPrompt, model));
            analysis = schemaValidator.parseAndValidateAnalysis(scoringCompletion.getContent());
        }
        applyCompletion(scoringRequest, scoringCompletion, (int) (System.currentTimeMillis() - globalStart));
        usageTracker.track(userId, scoringRequest.getId(), scoringCompletion);

        // Call 2: Transformation — includes CEFR level and band target for calibrated feedback
        String transformSystem = promptComposer.buildTransformationSystemPrompt(classification);
        AiRequest call2 = useStrong
                ? AiRequest.strong(transformSystem, transformPrompt, model)
                : AiRequest.cheap(transformSystem, transformPrompt, model);

        AiRequestEntity transformRequest = AiRequestEntity.builder()
                .userId(userId)
                .writingEntryId(entry.getId())
                .provider(providerRouter.getDefaultProviderType())
                .model(model)
                .callNumber(2)
                .build();
        aiRequestRepository.save(transformRequest);

        long call2Start = System.currentTimeMillis();
        AiCompletion transformCompletion;
        TransformationSchema transformation;
        try {
            transformCompletion = routeWithByok(entry, call2);
            transformation = schemaValidator.parseAndValidateTransformation(transformCompletion.getContent());
        } catch (LexiException ex) {
            if (ex.getErrorCode() != ErrorCode.AI_RESPONSE_INVALID) throw ex;
            log.warn("Call 2 schema violation for entry {}, retrying: {}", entry.getId(), ex.getMessage());
            String retryPrompt = promptComposer.buildSchemaRetryUserPrompt(transformPrompt, ex.getMessage());
            transformCompletion = routeWithByok(entry, AiRequest.cheap(transformSystem, retryPrompt, model));
            transformation = schemaValidator.parseAndValidateTransformation(transformCompletion.getContent());
        }
        applyCompletion(transformRequest, transformCompletion, (int) (System.currentTimeMillis() - call2Start));
        usageTracker.track(userId, transformRequest.getId(), transformCompletion);

        return saveFeedback(entry, scoringRequest, analysis, transformation);
    }

    // Daily English: single call — transformation + analytics in one shot
    private AiFeedbackEntity executeDailyPipeline(WritingEntry entry, UUID userId, String model,
                                                    String userPrompt, WritingClassification classification,
                                                    AiRequestEntity request, long start) {
        String system = promptComposer.buildDailySystemPrompt(classification);
        AiRequest call = AiRequest.cheap(system, userPrompt, model);

        AiCompletion completion;
        TransformationSchema transformation;
        try {
            completion = routeWithByok(entry, call);
            transformation = schemaValidator.parseAndValidateTransformation(completion.getContent());
        } catch (LexiException ex) {
            if (ex.getErrorCode() != ErrorCode.AI_RESPONSE_INVALID) throw ex;
            log.warn("Schema violation for daily entry {}, retrying: {}", entry.getId(), ex.getMessage());
            String retryPrompt = promptComposer.buildSchemaRetryUserPrompt(userPrompt, ex.getMessage());
            completion = routeWithByok(entry, AiRequest.cheap(system, retryPrompt, model));
            transformation = schemaValidator.parseAndValidateTransformation(completion.getContent());
        }
        applyCompletion(request, completion, (int) (System.currentTimeMillis() - start));
        usageTracker.track(userId, request.getId(), completion);

        return saveFeedback(entry, request, null, transformation);
    }

    private void applyCompletion(AiRequestEntity request, AiCompletion completion, int latencyMs) {
        request.setStatus(AiRequestStatus.SUCCESS);
        request.setProvider(completion.getProvider());
        request.setPromptTokens(completion.getPromptTokens());
        request.setCompletionTokens(completion.getCompletionTokens());
        request.setTotalTokens(completion.getPromptTokens() + completion.getCompletionTokens());
        request.setLatencyMs(latencyMs);
        request.setRawResponse(completion.getContent());
        aiRequestRepository.save(request);
    }

    private AiFeedbackEntity saveFeedback(WritingEntry entry, AiRequestEntity primaryRequest,
                                           AnalysisSchema analysis, TransformationSchema transformation) {
        // For IELTS: analytics + ieltsScore from Call 1 (examiner evaluation of raw text)
        // For Daily: analytics from transformation call (only source)
        String analyticsJson = analysis != null
                ? toJson(analysis.getAnalytics())
                : toJson(transformation.getAnalytics());

        Double confidence = analysis != null ? analysis.getConfidence() : transformation.getConfidence();

        AiFeedbackEntity feedback = AiFeedbackEntity.builder()
                .writingEntryId(entry.getId())
                .aiRequestId(primaryRequest.getId())
                .correctedText(transformation.getCorrectedText())
                .corrections(toJson(transformation.getCorrections()))
                .vocabularySuggestions(toJson(transformation.getVocabularySuggestions()))
                .rewrittenSentences(toJson(transformation.getRewrittenSentences()))
                .ieltsScore(analysis != null ? toJson(analysis.getIeltsScore()) : null)
                .analytics(analyticsJson)
                .confidence(confidence != null ? BigDecimal.valueOf(confidence) : null)
                .build();
        return aiFeedbackRepository.save(feedback);
    }

    private AiCompletion routeWithByok(WritingEntry entry, AiRequest request) {
        var user = entry.getUser();
        if (user.getGeminiApiKeyEncrypted() != null) {
            try {
                String key = encryptor.decrypt(user.getGeminiApiKeyEncrypted());
                return providerRouter.routeWithUserKey(request, key, AiProviderType.GEMINI);
            } catch (Exception ex) {
                log.warn("BYOK Gemini failed for user {}, falling back: {}", user.getId(), ex.getMessage());
            }
        }
        if (user.getOpenaiApiKeyEncrypted() != null) {
            try {
                String key = encryptor.decrypt(user.getOpenaiApiKeyEncrypted());
                return providerRouter.routeWithUserKey(request, key, AiProviderType.OPENAI);
            } catch (Exception ex) {
                log.warn("BYOK OpenAI failed for user {}, falling back: {}", user.getId(), ex.getMessage());
            }
        }
        return providerRouter.route(request);
    }

    private void triggerPostProcessing(UUID userId, WritingEntry entry, AiFeedbackEntity feedback) {
        try {
            FeedbackAnalyticsSnapshot snapshot = buildAnalyticsSnapshot(userId, entry, feedback);
            if (snapshot != null) analyticsService.updateAfterFeedback(snapshot);
        } catch (Exception ex) {
            log.warn("Analytics update failed for user {}: {}", userId, ex.getMessage());
        }
        try {
            mistakeTrackerService.trackFromFeedback(feedback.getId(), userId);
        } catch (Exception ex) {
            log.warn("Mistake tracking failed for user {}: {}", userId, ex.getMessage());
        }
    }

    private FeedbackAnalyticsSnapshot buildAnalyticsSnapshot(UUID userId, WritingEntry entry, AiFeedbackEntity feedback) {
        if (feedback.getAnalytics() == null) return null;
        try {
            AiFeedbackSchema.AnalyticsMeta meta = objectMapper.readValue(
                    feedback.getAnalytics(), AiFeedbackSchema.AnalyticsMeta.class);
            Double ieltsBand = null;
            if (feedback.getIeltsScore() != null) {
                AiFeedbackSchema.IeltsScore ielts = objectMapper.readValue(
                        feedback.getIeltsScore(), AiFeedbackSchema.IeltsScore.class);
                ieltsBand = ielts != null ? ielts.getBand() : null;
            }
            return new FeedbackAnalyticsSnapshot(
                    userId, entry.getId(), entry.getWordCount(),
                    meta.getGrammarAccuracy(), meta.getFluencyScore(), meta.getLexicalDiversity(),
                    meta.getNaturalnessScore(), meta.getEstimatedCefrLevel(),
                    meta.getSentenceCount(), meta.getAvgSentenceLength(), ieltsBand);
        } catch (Exception ex) {
            log.warn("Could not build analytics snapshot for entry {}: {}", entry.getId(), ex.getMessage());
            return null;
        }
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception ex) {
            return null;
        }
    }
}
