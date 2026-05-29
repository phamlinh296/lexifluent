package org.linh.lexi.flashcard.dto;

public record AnalyzeTranslationRequest(
        String vietnameseSentence,
        String userAnswer,
        String difficulty,    // optional, e.g. "B1"
        String targetStyle    // optional, e.g. "Daily English" | "IELTS"
) {}
