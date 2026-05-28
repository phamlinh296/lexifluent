package org.linh.lexi.ai.provider.openai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.RequiredArgsConstructor;
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
@ConditionalOnProperty(name = "lexi.ai.openai.api-key", matchIfMissing = false)
public class OpenAiProvider implements AiProvider {

    private final RestClient restClient;

    @Value("${lexi.ai.openai.api-key:}")
    private String apiKey;

    public OpenAiProvider(@Value("${lexi.ai.openai.base-url:https://api.openai.com}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    @Override
    public AiProviderType getType() {
        return AiProviderType.OPENAI;
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public AiCompletion complete(AiRequest request) {
        return doComplete(request, apiKey);
    }

    @Override
    public AiCompletion completeWithKey(AiRequest request, String apiKey) {
        return doComplete(request, apiKey);
    }

    private AiCompletion doComplete(AiRequest request, String key) {
        var body = Map.of(
                "model", request.getModel(),
                "temperature", request.getTemperature(),
                "max_tokens", request.getMaxTokens(),
                "response_format", request.isJsonMode() ? Map.of("type", "json_object") : Map.of("type", "text"),
                "messages", List.of(
                        Map.of("role", "system", "content", request.getSystemPrompt()),
                        Map.of("role", "user", "content", request.getUserPrompt())
                )
        );

        try {
            OpenAiResponse response = restClient.post()
                    .uri("/v1/chat/completions")
                    .header("Authorization", "Bearer " + key)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(OpenAiResponse.class);

            if (response == null || response.choices() == null || response.choices().isEmpty()) {
                throw new LexiException(ErrorCode.AI_RESPONSE_INVALID);
            }

            return AiCompletion.builder()
                    .content(response.choices().get(0).message().content())
                    .promptTokens(response.usage() != null ? response.usage().promptTokens() : 0)
                    .completionTokens(response.usage() != null ? response.usage().completionTokens() : 0)
                    .model(request.getModel())
                    .provider(AiProviderType.OPENAI)
                    .build();
        } catch (LexiException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("OpenAI request failed: {}", ex.getMessage());
            throw new LexiException(ErrorCode.AI_PROVIDER_UNAVAILABLE, ex);
        }
    }

    // --- Response DTOs ---

    @JsonIgnoreProperties(ignoreUnknown = true)
    record OpenAiResponse(List<Choice> choices, Usage usage) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Choice(Message message) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Message(String content) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Usage(
            @JsonProperty("prompt_tokens") int promptTokens,
            @JsonProperty("completion_tokens") int completionTokens
    ) {}
}
