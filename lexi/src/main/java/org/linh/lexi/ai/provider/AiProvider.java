package org.linh.lexi.ai.provider;

public interface AiProvider {
    AiProviderType getType();
    AiCompletion complete(AiRequest request);
    boolean isAvailable();

    // Override in providers that support BYOK
    default AiCompletion completeWithKey(AiRequest request, String apiKey) {
        return complete(request);
    }
}
