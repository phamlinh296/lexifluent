package org.linh.lexi.flashcard.repository;

import org.linh.lexi.flashcard.domain.Flashcard;
import org.linh.lexi.flashcard.domain.FlashcardType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FlashcardRepository extends JpaRepository<Flashcard, UUID> {

    List<Flashcard> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Flashcard> findByUserIdAndIsFavoriteTrueOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT f FROM Flashcard f JOIN f.groups g WHERE f.userId = :userId AND g.id = :groupId ORDER BY f.createdAt DESC")
    List<Flashcard> findByUserIdAndGroupId(@Param("userId") UUID userId, @Param("groupId") UUID groupId);

    @Query("""
            SELECT f FROM Flashcard f
            WHERE f.userId = :userId
              AND (f.nextReviewAt IS NULL OR f.nextReviewAt <= :now)
            ORDER BY CASE WHEN f.nextReviewAt IS NULL THEN 0 ELSE 1 END ASC, f.nextReviewAt ASC
            """)
    List<Flashcard> findDueByUserId(@Param("userId") UUID userId, @Param("now") Instant now);

    Optional<Flashcard> findByUserIdAndFrontIgnoreCase(UUID userId, String front);

    boolean existsByUserIdAndVocabularyItemId(UUID userId, UUID vocabularyItemId);

    Optional<Flashcard> findFirstByUserIdAndVocabularyItemIdAndType(UUID userId, UUID vocabularyItemId, FlashcardType type);
}
