package org.linh.lexi.writing.dto;

import org.linh.lexi.ai.classification.EssayType;
import org.linh.lexi.ai.classification.Task1Type;
import org.linh.lexi.ai.classification.TargetBand;
import org.linh.lexi.writing.domain.CorrectionStyle;
import org.linh.lexi.writing.domain.WritingMode;
import org.linh.lexi.writing.domain.WritingStatus;

import java.time.Instant;
import java.util.UUID;

public record WritingEntryDto(
        UUID id,
        WritingMode mode,
        CorrectionStyle correctionStyle,
        EssayType essayType,
        Task1Type task1Type,
        TargetBand targetBand,
        String title,
        String originalText,
        int wordCount,
        WritingStatus status,
        String topicPrompt,
        Instant submittedAt,
        Instant processedAt,
        Instant createdAt
) {}
