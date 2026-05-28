package org.linh.lexi.ai.provider.claude;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.ai.provider.AiCompletion;
import org.linh.lexi.ai.provider.AiProvider;
import org.linh.lexi.ai.provider.AiProviderType;
import org.linh.lexi.ai.provider.AiRequest;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@ConditionalOnProperty(name = "lexi.ai.claude.api-key", matchIfMissing = false)
public class ClaudeProvider implements AiProvider {

    private static final String ANTHROPIC_VERSION = "2023-06-01";

    private final RestClient restClient;

    @Value("${lexi.ai.claude.api-key:}")
    private String apiKey;

    public ClaudeProvider() {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.anthropic.com")
                .build();
    }

    @Override
    public AiProviderType getType() {
        return AiProviderType.CLAUDE;
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public AiCompletion complete(AiRequest request) {
        var body = Map.of(
                "model", request.getModel(),
                "max_tokens", request.getMaxTokens(),
                "temperature", request.getTemperature(),
                "system", request.getSystemPrompt(),
                "messages", List.of(Map.of("role", "user", "content", request.getUserPrompt()))
        );

        try {
            ClaudeResponse response = restClient.post()
                    .uri("/v1/messages")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", ANTHROPIC_VERSION)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(ClaudeResponse.class);

            if (response == null || response.content() == null || response.content().isEmpty()) {
                throw new LexiException(ErrorCode.AI_RESPONSE_INVALID);
            }

            return AiCompletion.builder()
                    .content(response.content().get(0).text())
                    .promptTokens(response.usage() != null ? response.usage().inputTokens() : 0)
                    .completionTokens(response.usage() != null ? response.usage().outputTokens() : 0)
                    .model(request.getModel())
                    .provider(AiProviderType.CLAUDE)
                    .build();
        } catch (LexiException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Claude request failed: {}", ex.getMessage());
            throw new LexiException(ErrorCode.AI_PROVIDER_UNAVAILABLE, ex);
        }
    }

    // --- Response DTOs ---

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ClaudeResponse(List<ContentBlock> content, Usage usage) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ContentBlock(String text) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Usage(
            @JsonProperty("input_tokens") int inputTokens,
            @JsonProperty("output_tokens") int outputTokens
    ) {}
}
