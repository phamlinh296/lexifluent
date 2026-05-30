package org.linh.lexi.ai.schema;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

/**
 * Structured JSON schema for all AI writing feedback responses.
 * All AI providers must return JSON matching this schema.
 * Version bumps require migration in AiFeedbackSchemaValidator.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiFeedbackSchema {

    private String version = "1.0";
    private String correctedText;
    private List<Correction> corrections;
    private List<VocabularySuggestion> vocabularySuggestions;
    private List<RewrittenSentence> rewrittenSentences;
    private IeltsScore ieltsScore;
    private AnalyticsMeta analytics;
    private Double confidence;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Correction {
        private String original;
        private String corrected;
        private String explanation;
        private String type;        // GRAMMAR | SPELLING | PUNCTUATION | WORD_CHOICE | STRUCTURE
        private String severity;    // LOW | MEDIUM | HIGH
        private int startOffset;    // character position in original text
        private int endOffset;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class VocabularySuggestion {
        private String word;
        private String phonetic;
        private String vietnameseMeaning;
        private List<String> alternatives;
        private List<String> collocations;
        private String cefrLevel;
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
        private String style;       // NATURAL, NATIVE, FORMAL, CONCISE
    }

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
