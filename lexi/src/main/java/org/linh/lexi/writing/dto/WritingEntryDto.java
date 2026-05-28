package org.linh.lexi.writing.dto;

import org.linh.lexi.writing.domain.CorrectionStyle;
import org.linh.lexi.writing.domain.WritingMode;
import org.linh.lexi.writing.domain.WritingStatus;

import java.time.Instant;
import java.util.UUID;

public record WritingEntryDto(
        UUID id,
        WritingMode mode,
        CorrectionStyle correctionStyle,
        String title,
        String originalText,
        int wordCount,
        WritingStatus status,
        String topicPrompt,
        Instant submittedAt,
        Instant processedAt,
        Instant createdAt
) {}
