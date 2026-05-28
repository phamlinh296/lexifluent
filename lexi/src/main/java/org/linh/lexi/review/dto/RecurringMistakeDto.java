package org.linh.lexi.review.dto;

import org.linh.lexi.review.domain.RecurringMistake;

import java.time.Instant;

public record RecurringMistakeDto(
        String mistakeType,
        String description,
        String example,
        int occurrenceCount,
        Instant lastSeenAt
) {
    public static RecurringMistakeDto from(RecurringMistake m) {
        return new RecurringMistakeDto(
                m.getMistakeType(), m.getDescription(), m.getExample(),
                m.getOccurrenceCount(), m.getLastSeenAt());
    }
}
