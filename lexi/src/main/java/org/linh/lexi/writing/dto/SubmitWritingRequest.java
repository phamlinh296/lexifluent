package org.linh.lexi.writing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.linh.lexi.ai.classification.EssayType;
import org.linh.lexi.ai.classification.Task1Type;
import org.linh.lexi.ai.classification.TargetBand;
import org.linh.lexi.writing.domain.CorrectionStyle;
import org.linh.lexi.writing.domain.WritingMode;

public record SubmitWritingRequest(
        @NotNull WritingMode mode,
        // nullable for IELTS modes — derived from targetBand in service
        CorrectionStyle correctionStyle,
        @NotBlank @Size(min = 20, max = 5000) String text,
        String title,
        String topicPrompt,
        // explicit classification — beats keyword detection when provided
        EssayType essayType,
        Task1Type task1Type,
        TargetBand targetBand
) {}
