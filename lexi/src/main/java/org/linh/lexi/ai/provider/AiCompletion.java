package org.linh.lexi.ai.provider;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiCompletion {
    private final String content;
    private final int promptTokens;
    private final int completionTokens;
    private final String model;
    private final AiProviderType provider;
}
