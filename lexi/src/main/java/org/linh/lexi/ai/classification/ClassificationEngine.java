package org.linh.lexi.ai.classification;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.review.repository.RecurringMistakeRepository;
import org.linh.lexi.writing.domain.CorrectionStyle;
import org.linh.lexi.writing.domain.WritingEntry;
import org.linh.lexi.writing.domain.WritingMode;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClassificationEngine {

    private final RecurringMistakeRepository mistakeRepository;

    public WritingClassification classify(WritingEntry entry, CorrectionStyle style, UUID userId) {
        WritingMode mode = entry.getMode();
        String prompt = entry.getTopicPrompt();

        // Explicit value from user → use directly; fallback to keyword detection
        EssayType essayType = entry.getEssayType() != null
                ? entry.getEssayType()
                : (mode == WritingMode.IELTS_TASK2 ? detectEssayType(prompt) : EssayType.NOT_APPLICABLE);

        Task1Type task1Type = entry.getTask1Type() != null
                ? entry.getTask1Type()
                : (mode == WritingMode.IELTS_TASK1 ? detectTask1Type(prompt) : Task1Type.NOT_APPLICABLE);

        TargetBand targetBand = entry.getTargetBand() != null
                ? entry.getTargetBand()
                : resolveTargetBand(style);

        List<String> weaknesses = mistakeRepository
                .findByUserIdOrderByOccurrenceCountDesc(userId)
                .stream()
                .limit(2)
                .map(m -> m.getMistakeType())
                .toList();

        return new WritingClassification(
                mode, style, essayType, task1Type,
                targetBand, ScoringFocus.BALANCED, weaknesses, null
        );
    }

    // Package-private so unit tests can call directly
    EssayType detectEssayType(String prompt) {
        if (prompt == null || prompt.isBlank()) return EssayType.DIRECT_QUESTION;
        String lower = prompt.toLowerCase();

        if (lower.contains("do you agree") || lower.contains("to what extent") || lower.contains("give your opinion"))
            return EssayType.OPINION;
        if (lower.contains("discuss both") || (lower.contains("some people") && lower.contains("others")))
            return EssayType.DISCUSSION;
        if (lower.contains("advantages and disadvantages") || lower.contains("outweigh"))
            return EssayType.ADVANTAGES_DISADVANTAGES;
        if ((lower.contains("problem") || lower.contains("cause")) && lower.contains("solution"))
            return EssayType.PROBLEM_SOLUTION;
        if (lower.contains("?") && countQuestionMarks(lower) >= 2)
            return EssayType.DOUBLE_QUESTION;

        return EssayType.DIRECT_QUESTION;
    }

    Task1Type detectTask1Type(String prompt) {
        if (prompt == null || prompt.isBlank()) return Task1Type.LINE_GRAPH;
        String lower = prompt.toLowerCase();

        if (lower.contains("bar chart") || lower.contains("bar graph")) return Task1Type.BAR_CHART;
        if (lower.contains("line graph") || lower.contains("line chart")) return Task1Type.LINE_GRAPH;
        if (lower.contains("pie chart") || lower.contains("pie graph")) return Task1Type.PIE_CHART;
        if (lower.contains("process") || lower.contains("stages") || lower.contains("how") && lower.contains("produced"))
            return Task1Type.PROCESS;
        if (lower.contains("map") || lower.contains("plan") || lower.contains("layout")) return Task1Type.MAP;
        if (lower.contains("table")) return Task1Type.TABLE;
        if (lower.contains("chart") && lower.contains("graph")) return Task1Type.MIXED_CHART;

        return Task1Type.LINE_GRAPH;  // safe fallback
    }

    TargetBand resolveTargetBand(CorrectionStyle style) {
        return switch (style) {
            case IELTS_BAND_6 -> TargetBand.BAND_6_5;
            case IELTS_BAND_7_8 -> TargetBand.BAND_7_5;
            default -> TargetBand.NOT_APPLICABLE;
        };
    }

    private int countQuestionMarks(String text) {
        int count = 0;
        for (char c : text.toCharArray()) if (c == '?') count++;
        return count;
    }
}
