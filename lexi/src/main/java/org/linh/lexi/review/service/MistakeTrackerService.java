package org.linh.lexi.review.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.ai.domain.AiFeedbackEntity;
import org.linh.lexi.ai.repository.AiFeedbackRepository;
import org.linh.lexi.ai.schema.AiFeedbackSchema;
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
            String desc = sample.getExplanation();

            mistakeRepository.findByUserIdAndMistakeType(userId, type).ifPresentOrElse(
                    existing -> {
                        existing.increment(example);
                        // Accumulate count for all corrections of this type in this feedback
                        existing.setOccurrenceCount(existing.getOccurrenceCount() + list.size() - 1);
                        mistakeRepository.save(existing);
                    },
                    () -> mistakeRepository.save(RecurringMistake.builder()
                            .userId(userId)
                            .mistakeType(type)
                            .description(desc)
                            .example(example)
                            .occurrenceCount(list.size())
                            .build())
            );
        });

        log.debug("Tracked {} mistake types for user {} from feedback {}", grouped.size(), userId, aiFeedbackId);
    }
}
