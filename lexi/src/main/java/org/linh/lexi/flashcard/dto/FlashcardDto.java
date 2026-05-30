package org.linh.lexi.flashcard.dto;

import org.linh.lexi.flashcard.domain.Flashcard;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record FlashcardDto(
        UUID id,
        String type,
        String front,
        String back,
        String hint,
        String phonetic,
        String vietnameseMeaning,
        String cefrLevel,
        String source,
        boolean isFavorite,
        UUID vocabularyItemId,
        Set<UUID> groupIds,
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
        Set<UUID> groupIds = card.getGroups() == null ? Set.of()
                : card.getGroups().stream().map(g -> g.getId()).collect(Collectors.toSet());
        return new FlashcardDto(
                card.getId(),
                card.getType() != null ? card.getType().name() : "BASIC",
                card.getFront(),
                card.getBack(),
                card.getHint(),
                card.getPhonetic(),
                card.getVietnameseMeaning(),
                card.getCefrLevel(),
                card.getSource(),
                card.isFavorite(),
                card.getVocabularyItemId(),
                groupIds,
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
