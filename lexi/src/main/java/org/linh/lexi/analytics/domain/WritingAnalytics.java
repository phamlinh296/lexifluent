package org.linh.lexi.analytics.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "writing_analytics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WritingAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "writing_entry_id", nullable = false)
    private UUID writingEntryId;

    @Column(name = "grammar_accuracy", precision = 5, scale = 2)
    private BigDecimal grammarAccuracy;

    @Column(name = "fluency_score", precision = 5, scale = 2)
    private BigDecimal fluencyScore;

    @Column(name = "lexical_diversity", precision = 5, scale = 2)
    private BigDecimal lexicalDiversity;

    @Column(name = "naturalness_score", precision = 5, scale = 2)
    private BigDecimal naturalnessScore;

    @Column(name = "estimated_ielts_band", precision = 3, scale = 1)
    private BigDecimal estimatedIeltsBand;

    @Column(name = "sentence_count")
    private Integer sentenceCount;

    @Column(name = "avg_sentence_length", precision = 5, scale = 2)
    private BigDecimal avgSentenceLength;

    @Column(name = "word_count")
    private Integer wordCount;

    @Column(name = "recorded_at", updatable = false)
    @Builder.Default
    private Instant recordedAt = Instant.now();
}
