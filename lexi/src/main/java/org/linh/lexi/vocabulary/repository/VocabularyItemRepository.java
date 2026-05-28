package org.linh.lexi.vocabulary.repository;

import org.linh.lexi.vocabulary.domain.VocabularyItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface VocabularyItemRepository extends JpaRepository<VocabularyItem, UUID> {

    Optional<VocabularyItem> findByUserIdAndWord(UUID userId, String word);

    Page<VocabularyItem> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<VocabularyItem> findByUserIdAndMasteredFalseOrderByEncounterCountDesc(UUID userId, Pageable pageable);

    @Modifying
    @Query("UPDATE VocabularyItem v SET v.encounterCount = v.encounterCount + 1, v.updatedAt = CURRENT_TIMESTAMP WHERE v.userId = :userId AND v.word = :word")
    void incrementEncounterCount(UUID userId, String word);
}
