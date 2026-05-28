package org.linh.lexi.flashcard.dto;

import java.util.UUID;

public record CreateFlashcardRequest(
        String front,            // word or phrase (required)
        String back,             // definition + example (required)
        String cefrLevel,        // optional
        UUID vocabularyItemId,   // optional — link to source vocab
        String type              // optional — BASIC | CLOZE | GRAMMAR_CORRECTION, defaults to BASIC
) {}
