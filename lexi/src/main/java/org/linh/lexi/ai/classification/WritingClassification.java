package org.linh.lexi.ai.classification;

import org.linh.lexi.writing.domain.CorrectionStyle;
import org.linh.lexi.writing.domain.WritingMode;

import java.util.List;

public record WritingClassification(
        WritingMode mode,
        CorrectionStyle style,
        EssayType essayType,
        Task1Type task1Type,
        TargetBand targetBand,
        ScoringFocus scoringFocus,
        List<String> userWeaknesses,
        String topic
) {
    // Minimal constructor for cases where only mode+style are known (backward compat)
    public static WritingClassification defaults(WritingMode mode, CorrectionStyle style) {
        EssayType essayType = mode == WritingMode.IELTS_TASK2
                ? EssayType.DIRECT_QUESTION
                : EssayType.NOT_APPLICABLE;

        Task1Type task1Type = mode == WritingMode.IELTS_TASK1
                ? Task1Type.LINE_GRAPH
                : Task1Type.NOT_APPLICABLE;

        TargetBand band = switch (style) {
            case IELTS_BAND_6 -> TargetBand.BAND_6_5;
            case IELTS_BAND_7_8 -> TargetBand.BAND_7_5;
            default -> TargetBand.NOT_APPLICABLE;
        };

        return new WritingClassification(
                mode, style, essayType, task1Type,
                band, ScoringFocus.BALANCED, List.of(), null
        );
    }

    public boolean isIelts() {
        return mode == WritingMode.IELTS_TASK1 || mode == WritingMode.IELTS_TASK2;
    }

    public boolean isTask1() {
        return mode == WritingMode.IELTS_TASK1;
    }

    public boolean isTask2() {
        return mode == WritingMode.IELTS_TASK2;
    }
}
