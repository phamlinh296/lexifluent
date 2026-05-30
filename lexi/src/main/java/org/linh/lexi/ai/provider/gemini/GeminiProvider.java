package org.linh.lexi.ai.provider.gemini;

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
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GeminiProvider implements AiProvider {

    private static final String BASE_URL = "https://generativelanguage.googleapis.com";
    // 2.5-flash is the current working model for this key; 2.0-flash as fallback for AI Studio keys
    private static final String MODEL_PRIMARY  = "gemini-2.5-flash";
    private static final String MODEL_FALLBACK = "gemini-2.0-flash";

    private final RestClient restClient;

    @Value("${lexi.ai.gemini.api-key:}")
    private String serverApiKey;

    public GeminiProvider() {
        this.restClient = RestClient.builder().baseUrl(BASE_URL).build();
    }

    @Override
    public AiProviderType getType() {
        return AiProviderType.GEMINI;
    }

    @Override
    public boolean isAvailable() {
        return serverApiKey != null && !serverApiKey.isBlank();
    }

    @Override
    public AiCompletion complete(AiRequest request) {
        return doComplete(request, serverApiKey);
    }

    @Override
    public AiCompletion completeWithKey(AiRequest request, String apiKey) {
        return doComplete(request, apiKey);
    }

    private AiCompletion doComplete(AiRequest request, String apiKey) {
        try {
            return callGemini(MODEL_PRIMARY, request, apiKey);
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 429) {
                log.warn("Gemini {} quota exceeded (limit=0 or rate limited), trying fallback model {}", MODEL_PRIMARY, MODEL_FALLBACK);
                try {
                    return callGemini(MODEL_FALLBACK, request, apiKey);
                } catch (RestClientResponseException ex2) {
                    log.error("Gemini fallback {} also failed: {} — {}", MODEL_FALLBACK, ex2.getStatusCode(), ex2.getResponseBodyAsString());
                    throw new LexiException(ErrorCode.AI_PROVIDER_UNAVAILABLE,
                            "Gemini quota exceeded on all models. Get a free key at aistudio.google.com/apikey");
                }
            }
            log.error("Gemini HTTP {} error: {}", ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new LexiException(ErrorCode.AI_PROVIDER_UNAVAILABLE, ex);
        } catch (LexiException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Gemini request failed: {}", ex.getMessage());
            throw new LexiException(ErrorCode.AI_PROVIDER_UNAVAILABLE, ex);
        }
    }

    private AiCompletion callGemini(String model, AiRequest request, String apiKey) {
        var body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", request.getSystemPrompt()))),
                "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text", request.getUserPrompt())))),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", request.getTemperature(),
                        "maxOutputTokens", request.getMaxTokens(),
                        "thinkingConfig", Map.of("thinkingBudget", 0)
                )
        );

        GeminiResponse response = restClient.post()
                .uri("/v1beta/models/" + model + ":generateContent?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, res) -> {
                    throw new RestClientResponseException(
                            "Gemini error " + res.getStatusCode().value(),
                            res.getStatusCode().value(), res.getStatusText(),
                            res.getHeaders(), res.getBody().readAllBytes(), null);
                })
                .body(GeminiResponse.class);

        if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
            throw new LexiException(ErrorCode.AI_RESPONSE_INVALID);
        }

        Candidate candidate = response.candidates().get(0);
        if (candidate.content() == null || candidate.content().parts() == null) {
            log.error("Gemini candidate has no content parts. finishReason={}", candidate.finishReason());
            throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, "Gemini returned empty content. finishReason=" + candidate.finishReason());
        }

        // Skip thinking parts (thought=true) — gemini-2.5-flash may include them even with thinkingBudget=0
        String content = candidate.content().parts().stream()
                .filter(p -> !p.isThought() && p.text() != null)
                .map(Part::text)
                .findFirst()
                .orElseThrow(() -> new LexiException(ErrorCode.AI_RESPONSE_INVALID, "Gemini returned no usable text part. finishReason=" + candidate.finishReason()));
        int promptTokens    = response.usageMetadata() != null ? response.usageMetadata().promptTokenCount() : 0;
        int completionTokens = response.usageMetadata() != null ? response.usageMetadata().candidatesTokenCount() : 0;

        return AiCompletion.builder()
                .content(content)
                .promptTokens(promptTokens)
                .completionTokens(completionTokens)
                .model(model)
                .provider(AiProviderType.GEMINI)
                .build();
    }

    // --- Response DTOs ---

    @JsonIgnoreProperties(ignoreUnknown = true)
    record GeminiResponse(List<Candidate> candidates, UsageMetadata usageMetadata) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Candidate(Content content, String finishReason) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Content(List<Part> parts) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Part(String text, @JsonProperty("thought") Boolean thought) {
        boolean isThought() { return Boolean.TRUE.equals(thought); }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record UsageMetadata(
            @JsonProperty("promptTokenCount") int promptTokenCount,
            @JsonProperty("candidatesTokenCount") int candidatesTokenCount
    ) {}
}
