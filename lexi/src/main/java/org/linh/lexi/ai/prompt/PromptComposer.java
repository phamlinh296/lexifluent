package org.linh.lexi.ai.prompt;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.writing.domain.CorrectionStyle;
import org.linh.lexi.writing.domain.WritingMode;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PromptComposer {

    static final String PROMPT_VERSION = "v1";

    private final PromptLoader loader;

    // IELTS Call 1: examiner scoring only — no rewrite context to prevent score inflation
    public String buildScoringSystemPrompt(WritingMode mode) {
        return join(
                loader.load("modes/" + modeFile(mode)),
                loader.load("pipeline/call1-scoring.txt"),
                loader.load("core/anti-hallucination.txt"),
                loader.load("core/json-schema-call1.txt")
        );
    }

    // IELTS Call 2: transformation only — no scoring
    public String buildTransformationSystemPrompt(WritingMode mode, CorrectionStyle style) {
        return join(
                loader.load("modes/" + modeFile(mode)),
                loader.load("styles/" + styleFile(style)),
                loader.load("pipeline/call2-transformation.txt"),
                loader.load("core/anti-hallucination.txt"),
                loader.load("core/json-schema-call2.txt")
        );
    }

    // Daily English: single call — transformation + analytics
    public String buildDailySystemPrompt(CorrectionStyle style) {
        return join(
                loader.load("modes/daily-english.txt"),
                loader.load("styles/" + styleFile(style)),
                loader.load("pipeline/call2-transformation.txt"),
                loader.load("core/anti-hallucination.txt"),
                loader.load("core/json-schema-daily.txt")
        );
    }

    public String buildUserPrompt(String userText, String topicPrompt, String cefrLevel) {
        var sb = new StringBuilder();
        if (topicPrompt != null && !topicPrompt.isBlank()) {
            sb.append("Task prompt: ").append(topicPrompt).append("\n\n");
        }
        if (cefrLevel != null && !cefrLevel.isBlank()) {
            sb.append("Writer's CEFR level: ").append(cefrLevel).append("\n\n");
        }
        sb.append("Writing to evaluate:\n").append(userText);
        return sb.toString();
    }

    public String buildSchemaRetryUserPrompt(String originalUserPrompt, String parseError) {
        return originalUserPrompt
                + "\n\n---\nSCHEMA VIOLATION — RETRY REQUIRED:\n"
                + "Error: " + parseError + "\n"
                + "Rules:\n"
                + "- Return ONLY valid parseable JSON. No markdown.\n"
                + "- Do not omit required fields.\n"
                + "- All enum values must exactly match the allowed list.\n"
                + "- startOffset >= 0, endOffset > startOffset (both integers).\n"
                + "- All numeric scores must be within their valid range.";
    }

    private String join(String... parts) {
        return String.join("\n\n", parts);
    }

    private String modeFile(WritingMode mode) {
        return switch (mode) {
            case IELTS_TASK1 -> "ielts-task1.txt";
            case IELTS_TASK2 -> "ielts-task2.txt";
            case DAILY_ENGLISH -> "daily-english.txt";
        };
    }

    private String styleFile(CorrectionStyle style) {
        return switch (style) {
            case GRAMMAR_CORRECTION -> "grammar.txt";
            case NATURAL_REWRITE -> "natural.txt";
            case NATIVE_REWRITE -> "native.txt";
            case IELTS_BAND_6 -> "ielts6.txt";
            case IELTS_BAND_7_8 -> "ielts78.txt";
        };
    }
}
