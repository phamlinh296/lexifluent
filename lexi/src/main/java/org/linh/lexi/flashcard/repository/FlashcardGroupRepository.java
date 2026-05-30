package org.linh.lexi.flashcard.repository;

import org.linh.lexi.flashcard.domain.FlashcardGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FlashcardGroupRepository extends JpaRepository<FlashcardGroup, UUID> {

    List<FlashcardGroup> findByUserIdOrderByCreatedAtAsc(UUID userId);

    boolean existsByUserIdAndName(UUID userId, String name);
}
