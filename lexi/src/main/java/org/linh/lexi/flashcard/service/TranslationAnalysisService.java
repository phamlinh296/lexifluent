package org.linh.lexi.flashcard.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.ai.domain.AiRequestEntity;
import org.linh.lexi.ai.domain.AiRequestStatus;
import org.linh.lexi.ai.provider.AiCompletion;
import org.linh.lexi.ai.provider.AiProviderRouter;
import org.linh.lexi.ai.provider.AiProviderType;
import org.linh.lexi.ai.provider.AiRequest;
import org.linh.lexi.ai.prompt.PromptLoader;
import org.linh.lexi.ai.repository.AiRequestRepository;
import org.linh.lexi.ai.schema.TranslationFeedbackSchema;
import org.linh.lexi.ai.usage.AiUsageTracker;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.linh.lexi.flashcard.domain.Flashcard;
import org.linh.lexi.flashcard.dto.AnalyzeTranslationRequest;
import org.linh.lexi.flashcard.repository.FlashcardRepository;
import org.linh.lexi.review.service.MistakeTrackerService;
import org.linh.lexi.user.domain.User;
import org.linh.lexi.user.repository.UserRepository;
import org.linh.lexi.user.util.UserApiKeyEncryptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TranslationAnalysisService {

    private final FlashcardRepository flashcardRepository;
    private final AiProviderRouter providerRouter;
    private final PromptLoader promptLoader;
    private final AiRequestRepository aiRequestRepository;
    private final AiUsageTracker usageTracker;
    private final MistakeTrackerService mistakeTrackerService;
    private final UserRepository userRepository;
    private final UserApiKeyEncryptor encryptor;
    private final ObjectMapper objectMapper;

    @Value("${lexi.ai.cheap-model:gemini-2.5-flash}")
    private String cheapModel;

    @Transactional
    public TranslationFeedbackSchema analyze(UUID userId, UUID flashcardId, AnalyzeTranslationRequest request) {
        Flashcard card = flashcardRepository.findById(flashcardId)
                .orElseThrow(() -> new LexiException(ErrorCode.FLASHCARD_NOT_FOUND));
        if (!card.getUserId().equals(userId)) {
            throw new LexiException(ErrorCode.ACCESS_DENIED);
        }

        usageTracker.checkQuota(userId);

        String systemPrompt = promptLoader.load("flashcard/translation-coach.txt");
        String userPrompt = buildUserPrompt(request);

        AiRequestEntity aiRequest = AiRequestEntity.builder()
                .userId(userId)
                .provider(providerRouter.getDefaultProviderType())
                .model(cheapModel)
                .build();
        aiRequestRepository.save(aiRequest);

        long start = System.currentTimeMillis();
        AiCompletion completion;
        TranslationFeedbackSchema feedback;
        try {
            completion = routeWithByok(userId, AiRequest.cheap(systemPrompt, userPrompt, cheapModel));
            feedback = parseSchema(completion.getContent());
        } catch (LexiException ex) {
            if (ex.getErrorCode() != ErrorCode.AI_RESPONSE_INVALID) throw ex;
            log.warn("Translation schema violation for flashcard {}, retrying", flashcardId);
            String retryPrompt = userPrompt + "\n\n---\nPREVIOUS RESPONSE WAS INVALID. Return ONLY valid JSON matching the schema. No markdown.";
            completion = routeWithByok(userId, AiRequest.cheap(systemPrompt, retryPrompt, cheapModel));
            feedback = parseSchema(completion.getContent());
        }

        aiRequest.setStatus(AiRequestStatus.SUCCESS);
        aiRequest.setProvider(completion.getProvider());
        aiRequest.setPromptTokens(completion.getPromptTokens());
        aiRequest.setCompletionTokens(completion.getCompletionTokens());
        aiRequest.setTotalTokens(completion.getPromptTokens() + completion.getCompletionTokens());
        aiRequest.setLatencyMs((int) (System.currentTimeMillis() - start));
        aiRequestRepository.save(aiRequest);

        usageTracker.track(userId, aiRequest.getId(), completion);

        try {
            mistakeTrackerService.trackFromTranslationMistakes(userId, feedback.getMistakes());
        } catch (Exception ex) {
            log.warn("Mistake tracking failed for user {} (translation): {}", userId, ex.getMessage());
        }

        card.applyReview(scoreToQuality(feedback.getOverallScore()));
        flashcardRepository.save(card);

        return feedback;
    }

    private String buildUserPrompt(AnalyzeTranslationRequest req) {
        var sb = new StringBuilder();
        sb.append("Vietnamese:\n\"").append(req.vietnameseSentence()).append("\"\n\n");
        sb.append("User Answer:\n\"").append(req.userAnswer()).append("\"");
        if (req.difficulty() != null && !req.difficulty().isBlank()) {
            sb.append("\n\nDifficulty:\n").append(req.difficulty());
        }
        if (req.targetStyle() != null && !req.targetStyle().isBlank()) {
            sb.append("\n\nTarget Style:\n").append(req.targetStyle());
        }
        return sb.toString();
    }

    private TranslationFeedbackSchema parseSchema(String content) {
        String json = content.trim();
        if (json.startsWith("```")) {
            json = json.replaceAll("```[a-zA-Z]*\\n?", "").replaceAll("```", "").trim();
        }
        try {
            return objectMapper.readValue(json, TranslationFeedbackSchema.class);
        } catch (Exception ex) {
            throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, "Translation schema parse failed: " + ex.getMessage());
        }
    }

    private AiCompletion routeWithByok(UUID userId, AiRequest request) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                if (user.getGeminiApiKeyEncrypted() != null) {
                    try {
                        return providerRouter.routeWithUserKey(request,
                                encryptor.decrypt(user.getGeminiApiKeyEncrypted()), AiProviderType.GEMINI);
                    } catch (Exception ex) {
                        log.warn("BYOK Gemini failed for user {}, falling back: {}", userId, ex.getMessage());
                    }
                }
                if (user.getOpenaiApiKeyEncrypted() != null) {
                    try {
                        return providerRouter.routeWithUserKey(request,
                                encryptor.decrypt(user.getOpenaiApiKeyEncrypted()), AiProviderType.OPENAI);
                    } catch (Exception ex) {
                        log.warn("BYOK OpenAI failed for user {}, falling back: {}", userId, ex.getMessage());
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("BYOK lookup failed for user {}, using server route: {}", userId, ex.getMessage());
        }
        return providerRouter.route(request);
    }

    private int scoreToQuality(int overallScore) {
        if (overallScore >= 90) return 5;
        if (overallScore >= 75) return 4;
        if (overallScore >= 60) return 3;
        if (overallScore >= 40) return 2;
        return 1;
    }
}
