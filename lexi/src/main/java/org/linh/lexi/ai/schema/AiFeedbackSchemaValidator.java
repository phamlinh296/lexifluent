package org.linh.lexi.ai.schema;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.springframework.stereotype.Component;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiFeedbackSchemaValidator {

    private static final Set<String> CORRECTION_TYPES = Set.of("GRAMMAR", "SPELLING", "PUNCTUATION", "WORD_CHOICE", "STRUCTURE");
    private static final Set<String> SEVERITIES = Set.of("LOW", "MEDIUM", "HIGH");
    private static final Set<String> CEFR_LEVELS = Set.of("A1", "A2", "B1", "B2", "C1", "C2");
    private static final Set<String> REWRITE_STYLES = Set.of("NATURAL", "NATIVE", "FORMAL", "CONCISE");

    private final ObjectMapper objectMapper;

    public AnalysisSchema parseAndValidateAnalysis(String rawJson) {
        String json = stripMarkdown(rawJson);
        try {
            AnalysisSchema schema = objectMapper.readValue(json, AnalysisSchema.class);
            validateAnalysis(schema);
            return schema;
        } catch (JsonProcessingException ex) {
            log.warn("Analysis schema parse failed: {}", ex.getMessage());
            throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, "Analysis JSON parse failed: " + ex.getOriginalMessage());
        }
    }

    public TransformationSchema parseAndValidateTransformation(String rawJson) {
        String json = stripMarkdown(rawJson);
        try {
            TransformationSchema schema = objectMapper.readValue(json, TransformationSchema.class);
            validateTransformation(schema);
            return schema;
        } catch (JsonProcessingException ex) {
            log.warn("Transformation schema parse failed: {}", ex.getMessage());
            throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, "Transformation JSON parse failed: " + ex.getOriginalMessage());
        }
    }

    private void validateAnalysis(AnalysisSchema schema) {
        if (schema.getAnalytics() == null) {
            throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, "analytics is required");
        }
        validateRatio("confidence", schema.getConfidence());
        if (schema.getIeltsScore() != null) {
            var s = schema.getIeltsScore();
            validateBand("band", s.getBand());
            validateBand("taskAchievement", s.getTaskAchievement());
            validateBand("coherenceCohesion", s.getCoherenceCohesion());
            validateBand("lexicalResource", s.getLexicalResource());
            validateBand("grammaticalRange", s.getGrammaticalRange());
        }
        var a = schema.getAnalytics();
        validateRatio("grammarAccuracy", a.getGrammarAccuracy());
        validateRatio("fluencyScore", a.getFluencyScore());
        validateRatio("lexicalDiversity", a.getLexicalDiversity());
        validateRatio("naturalnessScore", a.getNaturalnessScore());
        if (a.getEstimatedCefrLevel() != null && !CEFR_LEVELS.contains(a.getEstimatedCefrLevel())) {
            throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, "invalid estimatedCefrLevel: " + a.getEstimatedCefrLevel());
        }
    }

    private void validateTransformation(TransformationSchema schema) {
        if (schema.getCorrectedText() == null || schema.getCorrectedText().isBlank()) {
            throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, "correctedText is required");
        }
        if (schema.getCorrections() != null) {
            for (var c : schema.getCorrections()) {
                if (c.getStartOffset() < 0) {
                    throw new LexiException(ErrorCode.AI_RESPONSE_INVALID,
                            "startOffset must be >= 0, got: " + c.getStartOffset());
                }
                if (c.getEndOffset() <= c.getStartOffset()) {
                    throw new LexiException(ErrorCode.AI_RESPONSE_INVALID,
                            "endOffset must be > startOffset, got startOffset=" + c.getStartOffset()
                                    + " endOffset=" + c.getEndOffset());
                }
                if (c.getType() != null && !CORRECTION_TYPES.contains(c.getType())) {
                    throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, "invalid correction type: " + c.getType());
                }
                if (c.getSeverity() != null && !SEVERITIES.contains(c.getSeverity())) {
                    throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, "invalid severity: " + c.getSeverity());
                }
            }
        }
        if (schema.getVocabularySuggestions() != null) {
            for (var v : schema.getVocabularySuggestions()) {
                if (v.getCefrLevel() != null && !CEFR_LEVELS.contains(v.getCefrLevel())) {
                    throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, "invalid cefrLevel: " + v.getCefrLevel());
                }
            }
        }
        if (schema.getRewrittenSentences() != null) {
            for (var r : schema.getRewrittenSentences()) {
                if (r.getStyle() != null && !REWRITE_STYLES.contains(r.getStyle())) {
                    throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, "invalid rewrite style: " + r.getStyle());
                }
            }
        }
        if (schema.getAnalytics() != null) {
            var a = schema.getAnalytics();
            validateRatio("grammarAccuracy", a.getGrammarAccuracy());
            validateRatio("fluencyScore", a.getFluencyScore());
            validateRatio("lexicalDiversity", a.getLexicalDiversity());
            validateRatio("naturalnessScore", a.getNaturalnessScore());
        }
        validateRatio("confidence", schema.getConfidence());
    }

    private void validateBand(String field, Double value) {
        if (value != null && (value < 0.0 || value > 9.0)) {
            throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, field + " must be 0.0–9.0, got: " + value);
        }
    }

    private void validateRatio(String field, Double value) {
        if (value != null && (value < 0.0 || value > 1.0)) {
            throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, field + " must be 0.0–1.0, got: " + value);
        }
    }

    private String stripMarkdown(String raw) {
        if (raw == null) {
            throw new LexiException(ErrorCode.AI_RESPONSE_INVALID, "AI returned null response");
        }
        String t = raw.trim();
        if (t.startsWith("```json")) {
            t = t.substring(7);
            int end = t.lastIndexOf("```");
            if (end > 0) t = t.substring(0, end);
        } else if (t.startsWith("```")) {
            t = t.substring(3);
            int end = t.lastIndexOf("```");
            if (end > 0) t = t.substring(0, end);
        }
        return t.trim();
    }
}
