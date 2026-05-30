package org.linh.lexi.vocabulary.domain;

import jakarta.persistence.*;
import lombok.*;
import org.linh.lexi.user.domain.CefrLevel;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vocabulary_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VocabularyItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "writing_entry_id")
    private UUID writingEntryId;

    @Column(nullable = false)
    private String word;

    @Column(columnDefinition = "TEXT")
    private String definition;

    @Column(name = "example_sentence", columnDefinition = "TEXT")
    private String exampleSentence;

    @Column(name = "part_of_speech")
    private String partOfSpeech;

    @Enumerated(EnumType.STRING)
    @Column(name = "cefr_level")
    private CefrLevel cefrLevel;

    @Column(name = "is_mastered")
    @Builder.Default
    private boolean mastered = false;

    @Column(name = "encounter_count")
    @Builder.Default
    private int encounterCount = 1;

    @Column(name = "topic_tag", length = 50)
    private String topicTag;

    @Column(name = "phonetic", columnDefinition = "VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    private String phonetic;

    @Column(name = "vietnamese_meaning", columnDefinition = "TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    private String vietnameseMeaning;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
