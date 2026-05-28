package org.linh.lexi.analytics.domain;

import jakarta.persistence.*;
import lombok.*;
import org.linh.lexi.user.domain.CefrLevel;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "user_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "total_entries")
    @Builder.Default
    private int totalEntries = 0;

    @Column(name = "total_words_written")
    @Builder.Default
    private int totalWordsWritten = 0;

    @Column(name = "avg_grammar_accuracy", precision = 5, scale = 2)
    private BigDecimal avgGrammarAccuracy;

    @Column(name = "avg_fluency_score", precision = 5, scale = 2)
    private BigDecimal avgFluencyScore;

    @Column(name = "avg_lexical_diversity", precision = 5, scale = 2)
    private BigDecimal avgLexicalDiversity;

    @Column(name = "estimated_ielts_band", precision = 3, scale = 1)
    private BigDecimal estimatedIeltsBand;

    @Enumerated(EnumType.STRING)
    @Column(name = "estimated_cefr")
    private CefrLevel estimatedCefr;

    @Column(name = "vocabulary_mastered")
    @Builder.Default
    private int vocabularyMastered = 0;

    @Column(name = "current_streak")
    @Builder.Default
    private int currentStreak = 0;

    @Column(name = "longest_streak")
    @Builder.Default
    private int longestStreak = 0;

    @Column(name = "flashcard_streak")
    @Builder.Default
    private int flashcardStreak = 0;

    @Column(name = "last_flashcard_date")
    private LocalDate lastFlashcardDate;

    @Column(name = "last_updated_at")
    @Builder.Default
    private Instant lastUpdatedAt = Instant.now();
}
