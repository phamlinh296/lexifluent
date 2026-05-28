package org.linh.lexi.ai.prompt;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.ai.classification.EssayType;
import org.linh.lexi.ai.classification.Task1Type;
import org.linh.lexi.ai.classification.TargetBand;
import org.linh.lexi.ai.classification.WritingClassification;
import org.linh.lexi.writing.domain.CorrectionStyle;
import org.linh.lexi.writing.domain.WritingMode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PromptComposer {

    static final String PROMPT_VERSION = "v2";

    private final PromptLoader loader;

    // --- Classification-aware methods (Phase 5+) ---

    // IELTS Call 1: examiner scoring — enriched with essay type + band context
    public String buildScoringSystemPrompt(WritingClassification ctx) {
        List<String> blocks = new ArrayList<>();
        blocks.add(loader.load("modes/" + modeFile(ctx.mode())));
        addEssayTypeBlock(blocks, ctx);
        addTask1TypeBlock(blocks, ctx);
        addBandBlock(blocks, ctx.targetBand());
        addWeaknessBlocks(blocks, ctx.userWeaknesses());
        blocks.add(loader.load("pipeline/call1-scoring.txt"));
        blocks.add(loader.load("core/anti-hallucination.txt"));
        blocks.add(loader.load("core/json-schema-call1.txt"));
        return joinNonBlank(blocks);
    }

    // IELTS Call 2: transformation — enriched with style + essay type context
    public String buildTransformationSystemPrompt(WritingClassification ctx) {
        List<String> blocks = new ArrayList<>();
        blocks.add(loader.load("modes/" + modeFile(ctx.mode())));
        blocks.add(loader.load("styles/" + styleFile(ctx.style())));
        addEssayTypeBlock(blocks, ctx);
        addTask1TypeBlock(blocks, ctx);
        addWeaknessBlocks(blocks, ctx.userWeaknesses());
        blocks.add(loader.load("pipeline/call2-transformation.txt"));
        blocks.add(loader.load("core/anti-hallucination.txt"));
        blocks.add(loader.load("core/json-schema-call2.txt"));
        return joinNonBlank(blocks);
    }

    // Daily English: single call — no IELTS-specific blocks
    public String buildDailySystemPrompt(WritingClassification ctx) {
        List<String> blocks = new ArrayList<>();
        blocks.add(loader.load("modes/daily-english.txt"));
        blocks.add(loader.load("styles/" + styleFile(ctx.style())));
        addWeaknessBlocks(blocks, ctx.userWeaknesses());
        blocks.add(loader.load("pipeline/call2-transformation.txt"));
        blocks.add(loader.load("core/anti-hallucination.txt"));
        blocks.add(loader.load("core/json-schema-daily.txt"));
        return joinNonBlank(blocks);
    }

    // --- Legacy methods (backward compat — delegates to classification-aware versions) ---

    public String buildScoringSystemPrompt(WritingMode mode) {
        return buildScoringSystemPrompt(WritingClassification.defaults(mode, CorrectionStyle.IELTS_BAND_7_8));
    }

    public String buildTransformationSystemPrompt(WritingMode mode, CorrectionStyle style) {
        return buildTransformationSystemPrompt(WritingClassification.defaults(mode, style));
    }

    public String buildDailySystemPrompt(CorrectionStyle style) {
        return buildDailySystemPrompt(WritingClassification.defaults(WritingMode.DAILY_ENGLISH, style));
    }

    // --- User prompt (unchanged) ---

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

    // --- Block helpers ---

    private void addEssayTypeBlock(List<String> blocks, WritingClassification ctx) {
        if (ctx.essayType() == EssayType.NOT_APPLICABLE) return;
        blocks.add(loader.loadOptional("essay_type/" + essayTypeFile(ctx.essayType())));
    }

    private void addTask1TypeBlock(List<String> blocks, WritingClassification ctx) {
        if (ctx.task1Type() == Task1Type.NOT_APPLICABLE) return;
        blocks.add(loader.loadOptional("task1_type/" + task1TypeFile(ctx.task1Type())));
    }

    private void addBandBlock(List<String> blocks, TargetBand band) {
        if (band == TargetBand.NOT_APPLICABLE) return;
        blocks.add(loader.loadOptional("band/" + bandFile(band)));
    }

    private void addWeaknessBlocks(List<String> blocks, List<String> weaknesses) {
        weaknesses.stream()
                .limit(2)
                .map(w -> loader.loadOptional("weakness/" + w + ".txt"))
                .filter(s -> !s.isBlank())
                .forEach(blocks::add);
    }

    private String joinNonBlank(List<String> parts) {
        return parts.stream()
                .filter(s -> s != null && !s.isBlank())
                .reduce((a, b) -> a + "\n\n" + b)
                .orElse("");
    }

    // --- File name mappings ---

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

    private String essayTypeFile(EssayType type) {
        return switch (type) {
            case OPINION -> "opinion.txt";
            case DISCUSSION -> "discussion.txt";
            case ADVANTAGES_DISADVANTAGES -> "advantages_disadvantages.txt";
            case PROBLEM_SOLUTION -> "problem_solution.txt";
            case DOUBLE_QUESTION -> "double_question.txt";
            case DIRECT_QUESTION -> "direct_question.txt";
            case NOT_APPLICABLE -> "";
        };
    }

    private String task1TypeFile(Task1Type type) {
        return switch (type) {
            case LINE_GRAPH -> "line_graph.txt";
            case BAR_CHART -> "bar_chart.txt";
            case PIE_CHART -> "pie_chart.txt";
            case TABLE -> "table.txt";
            case MIXED_CHART -> "mixed_chart.txt";
            case PROCESS -> "process.txt";
            case MAP -> "map.txt";
            case NOT_APPLICABLE -> "";
        };
    }

    private String bandFile(TargetBand band) {
        return switch (band) {
            case BAND_6_0 -> "band_6_0.txt";
            case BAND_6_5 -> "band_6_5.txt";
            case BAND_7_0 -> "band_7_0.txt";
            case BAND_7_5 -> "band_7_5.txt";
            case BAND_8_0 -> "band_8_0.txt";
            case BAND_8_5 -> "band_8_5.txt";
            case NOT_APPLICABLE -> "";
        };
    }
}
