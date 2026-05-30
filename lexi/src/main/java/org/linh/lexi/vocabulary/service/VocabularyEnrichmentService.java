package org.linh.lexi.vocabulary.service;

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
import org.linh.lexi.ai.schema.VocabEnrichmentSchema;
import org.linh.lexi.ai.usage.AiUsageTracker;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.linh.lexi.user.domain.CefrLevel;
import org.linh.lexi.user.domain.User;
import org.linh.lexi.user.repository.UserRepository;
import org.linh.lexi.user.util.UserApiKeyEncryptor;
import org.linh.lexi.vocabulary.domain.VocabularyItem;
import org.linh.lexi.vocabulary.repository.VocabularyItemRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VocabularyEnrichmentService {

    private final VocabularyItemRepository vocabularyItemRepository;
    private final AiProviderRouter providerRouter;
    private final PromptLoader promptLoader;
    private final AiRequestRepository aiRequestRepository;
    private final AiUsageTracker usageTracker;
    private final UserRepository userRepository;
    private final UserApiKeyEncryptor encryptor;
    private final ObjectMapper objectMapper;

    @Value("${lexi.ai.cheap-model:gemini-2.5-flash}")
    private String cheapModel;

    @Transactional
    public VocabularyItem addManually(UUID userId, String rawWord) {
        String word = rawWord.toLowerCase().trim();

        Optional<VocabularyItem> existing = vocabularyItemRepository.findByUserIdAndWord(userId, word);
        if (existing.isPresent()) {
            return existing.get();
        }

        usageTracker.checkQuota(userId);

        String systemPrompt = promptLoader.load("vocabulary/manual-add.txt");

        AiRequestEntity aiRequest = AiRequestEntity.builder()
                .userId(userId)
                .provider(providerRouter.getDefaultProviderType())
                .model(cheapModel)
                .build();
        aiRequestRepository.save(aiRequest);

        long start = System.currentTimeMillis();
        AiCompletion completion;
        VocabEnrichmentSchema schema;
        try {
            completion = routeWithByok(userId, AiRequest.cheap(systemPrompt, word, cheapModel));
            schema = parseSchema(completion.getContent());
        } catch (LexiException ex) {
            if (ex.getErrorCode() != ErrorCode.AI_RESPONSE_INVALID) throw ex;
            log.warn("Vocab enrichment schema violation for word '{}', retrying", word);
            String retry = word + "\n\n---\nPREVIOUS RESPONSE INVALID. Return ONLY valid JSON matching the schema.";
            completion = routeWithByok(userId, AiRequest.cheap(systemPrompt, retry, cheapModel));
            schema = parseSchema(completion.getContent());
        }

        aiRequest.setStatus(AiRequestStatus.SUCCESS);
        aiRequest.setProvider(completion.getProvider());
        aiRequest.setPromptTokens(completion.getPromptTokens());
        aiRequest.setCompletionTokens(completion.getCompletionTokens());
        aiRequest.setTotalTokens(completion.getPromptTokens() + completion.getCompletionTokens());
        aiRequest.setLatencyMs((int) (System.currentTimeMillis() - start));
        aiRequestRepository.save(aiRequest);

        usageTracker.track(userId, aiRequest.getId(), completion);

        VocabularyItem item = VocabularyItem.builder()
                .userId(userId)
                .word(word)
                .definition(schema.getDefinition())
                .exampleSentence(schema.getExampleSentence())
                .cefrLevel(parseCefr(schema.getCefrLevel()))
                .topicTag(normalizeTopic(schema.getTopic()))
                .build();
        return vocabularyItemRepository.save(item);
    }

    private VocabEnrichmentSchema parseSchema(String content) {
        String json = content.trim();
        if (json.startsWith("```")) {
            json = json.replaceAll("```[a-zA-Z]*\\n?", "").replaceAll("```", "").trim();
        }
        try {
            return objectMapper.readValue(json, VocabEnrichmentSchema.class);
        } catch (Exception ex) {
            throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, "Vocab enrichment parse failed: " + ex.getMessage());
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
                        log.warn("BYOK Gemini failed for user {}: {}", userId, ex.getMessage());
                    }
                }
                if (user.getOpenaiApiKeyEncrypted() != null) {
                    try {
                        return providerRouter.routeWithUserKey(request,
                                encryptor.decrypt(user.getOpenaiApiKeyEncrypted()), AiProviderType.OPENAI);
                    } catch (Exception ex) {
                        log.warn("BYOK OpenAI failed for user {}: {}", userId, ex.getMessage());
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("BYOK lookup failed for user {}: {}", userId, ex.getMessage());
        }
        return providerRouter.route(request);
    }

    private CefrLevel parseCefr(String raw) {
        if (raw == null) return null;
        try { return CefrLevel.valueOf(raw.toUpperCase().trim()); }
        catch (IllegalArgumentException ex) { return null; }
    }

    private String normalizeTopic(String raw) {
        if (raw == null || raw.isBlank()) return null;
        return raw.toLowerCase().trim();
    }
}
