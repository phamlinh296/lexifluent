package org.linh.lexi.flashcard.dto;

import org.linh.lexi.flashcard.domain.FlashcardGroup;

import java.time.Instant;
import java.util.UUID;

public record FlashcardGroupDto(
        UUID id,
        String name,
        Instant createdAt
) {
    public static FlashcardGroupDto from(FlashcardGroup group) {
        return new FlashcardGroupDto(group.getId(), group.getName(), group.getCreatedAt());
    }
}
