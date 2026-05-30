package org.linh.lexi.flashcard.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;
import org.linh.lexi.common.audit.BaseEntity;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "flashcards")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Flashcard extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private FlashcardType type = FlashcardType.BASIC;

    @Column(name = "vocabulary_item_id")
    private UUID vocabularyItemId;

    @Column(nullable = false)
    private String front;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String back;

    @Column(columnDefinition = "TEXT")
    private String hint;

    @Column(name = "cefr_level", length = 2)
    private String cefrLevel;

    @Column(name = "source", length = 50, nullable = false)
    @Builder.Default
    private String source = "AUTO";

    @Column(name = "is_favorite", nullable = false)
    @Builder.Default
    private boolean isFavorite = false;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "flashcard_group_items",
            joinColumns = @JoinColumn(name = "flashcard_id"),
            inverseJoinColumns = @JoinColumn(name = "group_id")
    )
    @Builder.Default
    private Set<FlashcardGroup> groups = new HashSet<>();

    // SM-2 SRS fields
    @Column(name = "ease_factor")
    @Builder.Default
    private double easeFactor = 2.5;

    @Column(name = "interval_days")
    @Builder.Default
    private int intervalDays = 0;

    @Column(name = "review_count")
    @Builder.Default
    private int reviewCount = 0;

    @Column(name = "next_review_at")
    private Instant nextReviewAt;

    @Column(name = "last_reviewed_at")
    private Instant lastReviewedAt;

    // SM-2 algorithm: quality 0-5 (0-2 = failed, 3+ = passed)
    public void applyReview(int quality) {
        if (quality < 3) {
            intervalDays = 1;
        } else {
            if (intervalDays == 0) {
                intervalDays = 1;
            } else if (intervalDays == 1) {
                intervalDays = 6;
            } else {
                intervalDays = (int) Math.round(intervalDays * easeFactor);
            }
        }
        easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        reviewCount++;
        lastReviewedAt = Instant.now();
        nextReviewAt = Instant.now().plusSeconds((long) intervalDays * 86400);
    }
}
