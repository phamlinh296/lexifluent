package org.linh.lexi.writing.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.linh.lexi.ai.classification.EssayType;
import org.linh.lexi.ai.classification.Task1Type;
import org.linh.lexi.ai.classification.TargetBand;
import org.linh.lexi.writing.domain.CorrectionStyle;
import org.linh.lexi.writing.domain.WritingMode;

public record SaveDraftRequest(
        @NotNull WritingMode mode,
        CorrectionStyle correctionStyle,
        @Size(max = 5000) String text,
        @Size(max = 300) String title,
        @Size(max = 2000) String topicPrompt,
        EssayType essayType,
        Task1Type task1Type,
        TargetBand targetBand
) {}
