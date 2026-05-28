package org.linh.lexi.ai.schema;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

// Response schema for Call 1 (IELTS scoring pass)
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AnalysisSchema {

    private String promptVersion;
    private IeltsScore ieltsScore;
    private AnalyticsMeta analytics;
    private Double confidence;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class IeltsScore {
        private Double band;
        private Double taskAchievement;
        private Double coherenceCohesion;
        private Double lexicalResource;
        private Double grammaticalRange;
        private String feedback;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AnalyticsMeta {
        private Double grammarAccuracy;
        private Double fluencyScore;
        private Double lexicalDiversity;
        private Double naturalnessScore;
        private String estimatedCefrLevel;
        private Integer sentenceCount;
        private Double avgSentenceLength;
    }
}
