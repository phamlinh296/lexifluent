package org.linh.lexi.ai.provider;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AiRequest {
    private final String systemPrompt;
    private final String userPrompt;
    private final String model;
    private final double temperature;
    private final int maxTokens;
    private final boolean jsonMode;

    public static AiRequest cheap(String systemPrompt, String userPrompt, String model) {
        return AiRequest.builder()
                .systemPrompt(systemPrompt)
                .userPrompt(userPrompt)
                .model(model)
                .temperature(0.3)
                .maxTokens(6000)
                .jsonMode(true)
                .build();
    }

    public static AiRequest strong(String systemPrompt, String userPrompt, String model) {
        return AiRequest.builder()
                .systemPrompt(systemPrompt)
                .userPrompt(userPrompt)
                .model(model)
                .temperature(0.5)
                .maxTokens(10000)
                .jsonMode(true)
                .build();
    }
}
