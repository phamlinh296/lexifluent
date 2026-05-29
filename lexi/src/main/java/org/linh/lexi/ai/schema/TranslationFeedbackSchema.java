package org.linh.lexi.ai.schema;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TranslationFeedbackSchema {

    private int overallScore;
    private int accuracyScore;
    private int naturalnessScore;
    private int grammarScore;
    private String cefrEstimate;

    private boolean isCorrect;
    private boolean partiallyCorrect;
    private boolean hasMultipleValidAnswers;

    private String correctedSentence;
    private String moreNaturalSentence;
    private String feedbackSummary;

    private List<MistakeItem> mistakes;
    private List<String> goodPoints;
    private List<String> suggestions;
    private List<String> keyLearningPoints;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MistakeItem {
        private String type;
        private String original;
        private String correction;
        private String explanation;
    }
}
