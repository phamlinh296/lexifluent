package org.linh.lexi.review.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.ai.domain.AiFeedbackEntity;
import org.linh.lexi.ai.repository.AiFeedbackRepository;
import org.linh.lexi.ai.schema.AiFeedbackSchema;
import org.linh.lexi.ai.schema.TranslationFeedbackSchema;
import org.linh.lexi.review.domain.RecurringMistake;
import org.linh.lexi.review.repository.RecurringMistakeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MistakeTrackerService {

    private final AiFeedbackRepository aiFeedbackRepository;
    private final RecurringMistakeRepository mistakeRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void trackFromFeedback(UUID aiFeedbackId, UUID userId) {
        AiFeedbackEntity feedback = aiFeedbackRepository.findById(aiFeedbackId).orElse(null);
        if (feedback == null || feedback.getCorrections() == null) return;

        List<AiFeedbackSchema.Correction> corrections;
        try {
            corrections = objectMapper.readValue(feedback.getCorrections(), new TypeReference<>() {});
        } catch (Exception ex) {
            log.warn("Could not parse corrections for feedback {}: {}", aiFeedbackId, ex.getMessage());
            return;
        }

        // Group corrections by type, count, pick most recent example per type
        Map<String, List<AiFeedbackSchema.Correction>> grouped = corrections.stream()
                .filter(c -> c.getType() != null)
                .collect(Collectors.groupingBy(c -> c.getType().toUpperCase()));

        grouped.forEach((type, list) -> {
            AiFeedbackSchema.Correction sample = list.get(0);
            String example = sample.getOriginal() != null && sample.getCorrected() != null
                    ? sample.getOriginal() + " → " + sample.getCorrected()
                    : null;
            upsertMistake(userId, type, sample.getExplanation(), example, list.size());
        });

        log.debug("Tracked {} mistake types for user {} from feedback {}", grouped.size(), userId, aiFeedbackId);
    }

    @Transactional
    public void trackFromTranslationMistakes(UUID userId, List<TranslationFeedbackSchema.MistakeItem> mistakes) {
        if (mistakes == null || mistakes.isEmpty()) return;

        Map<String, List<TranslationFeedbackSchema.MistakeItem>> grouped = mistakes.stream()
                .filter(m -> m.getType() != null)
                .collect(Collectors.groupingBy(m -> m.getType().toUpperCase()));

        grouped.forEach((type, list) -> {
            TranslationFeedbackSchema.MistakeItem sample = list.get(0);
            String example = sample.getOriginal() != null && sample.getCorrection() != null
                    ? sample.getOriginal() + " → " + sample.getCorrection()
                    : null;
            upsertMistake(userId, type, sample.getExplanation(), example, list.size());
        });

        log.debug("Tracked {} mistake types for user {} from translation feedback", grouped.size(), userId);
    }

    private void upsertMistake(UUID userId, String type, String desc, String example, int count) {
        mistakeRepository.findByUserIdAndMistakeType(userId, type).ifPresentOrElse(
                existing -> {
                    existing.increment(example);
                    existing.setOccurrenceCount(existing.getOccurrenceCount() + count - 1);
                    mistakeRepository.save(existing);
                },
                () -> mistakeRepository.save(RecurringMistake.builder()
                        .userId(userId)
                        .mistakeType(type)
                        .description(desc)
                        .example(example)
                        .occurrenceCount(count)
                        .build())
        );
    }
}
