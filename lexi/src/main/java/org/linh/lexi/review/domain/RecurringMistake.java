package org.linh.lexi.review.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "recurring_mistakes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecurringMistake {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    // e.g. "GRAMMAR", "WORD_CHOICE", "SPELLING", "PUNCTUATION", "STRUCTURE"
    @Column(name = "mistake_type", nullable = false, length = 100)
    private String mistakeType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String example;

    @Column(name = "occurrence_count", nullable = false)
    @Builder.Default
    private int occurrenceCount = 1;

    @Column(name = "last_seen_at", nullable = false)
    @Builder.Default
    private Instant lastSeenAt = Instant.now();

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    public void increment(String newExample) {
        this.occurrenceCount++;
        this.lastSeenAt = Instant.now();
        this.updatedAt = Instant.now();
        if (newExample != null) this.example = newExample;
    }
}
