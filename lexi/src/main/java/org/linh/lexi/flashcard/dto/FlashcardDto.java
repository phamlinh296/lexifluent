package org.linh.lexi.flashcard.dto;

import org.linh.lexi.flashcard.domain.Flashcard;

import java.time.Instant;
import java.util.UUID;

public record FlashcardDto(
        UUID id,
        String type,
        String front,
        String back,
        String cefrLevel,
        double easeFactor,
        int intervalDays,
        int reviewCount,
        Instant nextReviewAt,
        Instant lastReviewedAt,
        Instant createdAt,
        boolean isDue
) {
    public static FlashcardDto from(Flashcard card) {
        boolean due = card.getNextReviewAt() == null || card.getNextReviewAt().isBefore(Instant.now());
        return new FlashcardDto(
                card.getId(),
                card.getType() != null ? card.getType().name() : "BASIC",
                card.getFront(),
                card.getBack(),
                card.getCefrLevel(),
                card.getEaseFactor(),
                card.getIntervalDays(),
                card.getReviewCount(),
                card.getNextReviewAt(),
                card.getLastReviewedAt(),
                card.getCreatedAt(),
                due
        );
    }
}
