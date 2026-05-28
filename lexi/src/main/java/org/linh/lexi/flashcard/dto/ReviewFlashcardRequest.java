package org.linh.lexi.flashcard.dto;

public record ReviewFlashcardRequest(
        int quality  // SM-2 quality: 0-5 (0=complete blackout, 5=perfect)
) {}
