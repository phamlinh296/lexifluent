package org.linh.lexi.ai.schema;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

// Response schema for Call 2 (IELTS transformation) and single-call (Daily English)
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class TransformationSchema {

    private String promptVersion;
    private String correctedText;
    private List<Correction> corrections;
    private List<VocabularySuggestion> vocabularySuggestions;
    private List<RewrittenSentence> rewrittenSentences;

    // Populated for Daily English only (single-call mode includes analytics)
    private AnalyticsMeta analytics;
    private Double confidence;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Correction {
        private String original;
        private String corrected;
        private String explanation;
        private String type;      // GRAMMAR | SPELLING | PUNCTUATION | WORD_CHOICE | STRUCTURE
        private String severity;  // LOW | MEDIUM | HIGH
        private int startOffset;  // character position in original text
        private int endOffset;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class VocabularySuggestion {
        private String word;
        private List<String> alternatives;
        private List<String> collocations;
        private String cefrLevel;  // A1 | A2 | B1 | B2 | C1 | C2
        private String definition;
        private String exampleSentence;
        // Topic classification stored once in DB — no re-analysis needed
        private String topic; // education|technology|business|health|environment|travel|linking_word|academic|daily_life|social|science|law
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RewrittenSentence {
        private String original;
        private String rewritten;
        private String reason;
        private String style;  // NATURAL | NATIVE | FORMAL | CONCISE
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
