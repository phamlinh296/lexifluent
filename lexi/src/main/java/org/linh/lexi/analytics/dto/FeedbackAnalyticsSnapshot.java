package org.linh.lexi.analytics.dto;

import java.util.UUID;

public record FeedbackAnalyticsSnapshot(
        UUID userId,
        UUID writingEntryId,
        int wordCount,
        Double grammarAccuracy,
        Double fluencyScore,
        Double lexicalDiversity,
        Double naturalnessScore,
        String estimatedCefrLevel,
        Integer sentenceCount,
        Double avgSentenceLength,
        Double ieltsBand
) {}
