package org.linh.lexi.ai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.linh.lexi.ai.domain.AiFeedbackEntity;
import org.linh.lexi.ai.repository.AiFeedbackRepository;
import org.linh.lexi.ai.schema.AiFeedbackSchema;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.linh.lexi.common.response.ApiResponse;
import org.linh.lexi.common.security.LexiUserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/writing/{entryId}/feedback")
@RequiredArgsConstructor
public class AiFeedbackController {

    private final AiFeedbackRepository aiFeedbackRepository;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ApiResponse<AiFeedbackSchema> getLatestFeedback(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID entryId) {
        AiFeedbackEntity entity = aiFeedbackRepository
                .findTopByWritingEntryIdOrderByCreatedAtDesc(entryId)
                .orElseThrow(() -> new LexiException(ErrorCode.AI_REQUEST_NOT_FOUND));

        AiFeedbackSchema schema = new AiFeedbackSchema();
        schema.setCorrectedText(entity.getCorrectedText());

        try {
            if (entity.getCorrections() != null) {
                schema.setCorrections(objectMapper.readValue(entity.getCorrections(),
                        objectMapper.getTypeFactory().constructCollectionType(
                                java.util.List.class, AiFeedbackSchema.Correction.class)));
            }
            if (entity.getVocabularySuggestions() != null) {
                schema.setVocabularySuggestions(objectMapper.readValue(entity.getVocabularySuggestions(),
                        objectMapper.getTypeFactory().constructCollectionType(
                                java.util.List.class, AiFeedbackSchema.VocabularySuggestion.class)));
            }
            if (entity.getRewrittenSentences() != null) {
                schema.setRewrittenSentences(objectMapper.readValue(entity.getRewrittenSentences(),
                        objectMapper.getTypeFactory().constructCollectionType(
                                java.util.List.class, AiFeedbackSchema.RewrittenSentence.class)));
            }
            if (entity.getIeltsScore() != null) {
                schema.setIeltsScore(objectMapper.readValue(entity.getIeltsScore(), AiFeedbackSchema.IeltsScore.class));
            }
            if (entity.getAnalytics() != null) {
                schema.setAnalytics(objectMapper.readValue(entity.getAnalytics(), AiFeedbackSchema.AnalyticsMeta.class));
            }
        } catch (Exception ex) {
            // Partial parse — return what we have
        }

        return ApiResponse.ok(schema);
    }
}
