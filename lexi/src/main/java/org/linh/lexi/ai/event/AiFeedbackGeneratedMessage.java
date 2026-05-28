package org.linh.lexi.ai.event;

import java.util.UUID;

public record AiFeedbackGeneratedMessage(
        UUID writingEntryId,
        UUID aiFeedbackId,
        UUID userId
) {}
