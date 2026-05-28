package org.linh.lexi.writing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.linh.lexi.writing.domain.CorrectionStyle;
import org.linh.lexi.writing.domain.WritingMode;

public record SubmitWritingRequest(
        @NotNull WritingMode mode,
        @NotNull CorrectionStyle correctionStyle,
        @NotBlank @Size(min = 20, max = 5000) String text,
        String title,
        String topicPrompt
) {}
