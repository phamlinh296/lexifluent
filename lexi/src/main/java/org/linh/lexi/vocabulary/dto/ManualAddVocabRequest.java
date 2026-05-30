package org.linh.lexi.vocabulary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ManualAddVocabRequest(
        @NotBlank @Size(max = 200) String word
) {}
