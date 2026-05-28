package org.linh.lexi.ai.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_feedbacks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiFeedbackEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "writing_entry_id", nullable = false)
    private UUID writingEntryId;

    @Column(name = "ai_request_id", nullable = false)
    private UUID aiRequestId;

    @Column(name = "schema_version", nullable = false)
    @Builder.Default
    private String schemaVersion = "1.0";

    @Column(name = "corrected_text", columnDefinition = "MEDIUMTEXT")
    private String correctedText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private String corrections;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "vocabulary_suggestions", columnDefinition = "json")
    private String vocabularySuggestions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "rewritten_sentences", columnDefinition = "json")
    private String rewrittenSentences;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ielts_score", columnDefinition = "json")
    private String ieltsScore;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private String analytics;

    @Column(precision = 3, scale = 2)
    private BigDecimal confidence;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
