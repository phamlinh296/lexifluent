package org.linh.lexi.flashcard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateFlashcardGroupRequest(
        @NotBlank @Size(max = 100) String name
) {}
