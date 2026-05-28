package org.linh.lexi.ai.provider;

import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
public class AiProviderRouter {

    private final Map<AiProviderType, AiProvider> providers;
    private final AiProviderType defaultProvider;
    private final AiProviderType fallbackProvider;

    public AiProviderRouter(
            List<AiProvider> providerList,
            @Value("${lexi.ai.default-provider:OPENAI}") String defaultProvider,
            @Value("${lexi.ai.fallback-provider:CLAUDE}") String fallbackProvider) {
        this.providers = providerList.stream()
                .collect(Collectors.toMap(AiProvider::getType, Function.identity()));
        this.defaultProvider = AiProviderType.valueOf(defaultProvider);
        this.fallbackProvider = AiProviderType.valueOf(fallbackProvider);
    }

    public AiCompletion route(AiRequest request) {
        AiProvider primary = providers.get(defaultProvider);
        if (primary != null && primary.isAvailable()) {
            try {
                return primary.complete(request);
            } catch (Exception ex) {
                log.warn("Primary AI provider {} failed, trying fallback: {}", defaultProvider, ex.getMessage());
            }
        }

        AiProvider fallback = providers.get(fallbackProvider);
        if (fallback != null && fallback.isAvailable()) {
            return fallback.complete(request);
        }

        throw new LexiException(ErrorCode.AI_PROVIDER_UNAVAILABLE);
    }

    public AiProviderType getDefaultProviderType() {
        return defaultProvider;
    }

    public AiCompletion routeWith(AiProviderType preferred, AiRequest request) {
        AiProvider provider = providers.get(preferred);
        if (provider != null && provider.isAvailable()) {
            return provider.complete(request);
        }
        return route(request);
    }

    // BYOK: use user's own API key — bypasses server quota
    public AiCompletion routeWithUserKey(AiRequest request, String apiKey, AiProviderType providerType) {
        AiProvider provider = providers.get(providerType);
        if (provider != null) {
            return provider.completeWithKey(request, apiKey);
        }
        log.warn("BYOK provider {} not registered, falling back to server route", providerType);
        return route(request);
    }
}
