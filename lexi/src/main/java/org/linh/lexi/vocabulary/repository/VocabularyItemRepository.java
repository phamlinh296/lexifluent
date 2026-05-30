package org.linh.lexi.vocabulary.repository;

import org.linh.lexi.vocabulary.domain.VocabularyItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VocabularyItemRepository extends JpaRepository<VocabularyItem, UUID> {

    Optional<VocabularyItem> findByUserIdAndWord(UUID userId, String word);

    Page<VocabularyItem> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<VocabularyItem> findByUserIdAndTopicTagOrderByCreatedAtDesc(UUID userId, String topicTag, Pageable pageable);

    Page<VocabularyItem> findByUserIdAndMasteredFalseOrderByEncounterCountDesc(UUID userId, Pageable pageable);

    @Query("SELECT DISTINCT v.topicTag FROM VocabularyItem v WHERE v.userId = :userId AND v.topicTag IS NOT NULL ORDER BY v.topicTag ASC")
    List<String> findDistinctTopicsByUserId(@Param("userId") UUID userId);

    @Query("SELECT v.topicTag, COUNT(v) FROM VocabularyItem v WHERE v.userId = :userId AND v.topicTag IS NOT NULL GROUP BY v.topicTag ORDER BY COUNT(v) DESC")
    List<Object[]> countByTopicForUser(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE VocabularyItem v SET v.encounterCount = v.encounterCount + 1, v.updatedAt = CURRENT_TIMESTAMP WHERE v.userId = :userId AND v.word = :word")
    void incrementEncounterCount(@Param("userId") UUID userId, @Param("word") String word);
}
