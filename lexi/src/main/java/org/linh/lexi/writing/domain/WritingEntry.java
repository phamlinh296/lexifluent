package org.linh.lexi.writing.domain;

import jakarta.persistence.*;
import lombok.*;
import org.linh.lexi.ai.classification.EssayType;
import org.linh.lexi.ai.classification.Task1Type;
import org.linh.lexi.ai.classification.TargetBand;
import org.linh.lexi.common.audit.BaseEntity;
import org.linh.lexi.user.domain.User;

import java.time.Instant;

@Entity
@Table(name = "writing_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WritingEntry extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WritingMode mode;

    @Enumerated(EnumType.STRING)
    @Column(name = "correction_style", nullable = false)
    @Builder.Default
    private CorrectionStyle correctionStyle = CorrectionStyle.GRAMMAR_CORRECTION;

    @Enumerated(EnumType.STRING)
    @Column(name = "essay_type")
    private EssayType essayType;

    @Enumerated(EnumType.STRING)
    @Column(name = "task1_type")
    private Task1Type task1Type;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_band")
    private TargetBand targetBand;

    private String title;

    @Column(name = "original_text", nullable = false, columnDefinition = "TEXT")
    private String originalText;

    @Column(name = "word_count")
    @Builder.Default
    private int wordCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private WritingStatus status = WritingStatus.DRAFT;

    @Column(name = "topic_prompt", columnDefinition = "TEXT")
    private String topicPrompt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    public void submit() {
        this.status = WritingStatus.SUBMITTED;
        this.submittedAt = Instant.now();
        this.wordCount = countWords(this.originalText);
    }

    public void markProcessing() {
        this.status = WritingStatus.AI_PROCESSING;
    }

    public void markProcessed() {
        this.status = WritingStatus.PROCESSED;
        this.processedAt = Instant.now();
    }

    public void markFailed() {
        this.status = WritingStatus.FAILED;
    }

    private static int countWords(String text) {
        if (text == null || text.isBlank()) return 0;
        return text.trim().split("\\s+").length;
    }
}
