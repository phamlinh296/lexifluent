package org.linh.lexi.writing.event;

import java.util.UUID;

public record WritingSubmittedMessage(
        UUID writingEntryId,
        UUID userId,
        String mode,
        String correctionStyle
) {}
