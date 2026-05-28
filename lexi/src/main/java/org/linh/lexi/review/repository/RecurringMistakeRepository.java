package org.linh.lexi.review.repository;

import org.linh.lexi.review.domain.RecurringMistake;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecurringMistakeRepository extends JpaRepository<RecurringMistake, UUID> {

    List<RecurringMistake> findByUserIdOrderByOccurrenceCountDesc(UUID userId);

    Optional<RecurringMistake> findByUserIdAndMistakeType(UUID userId, String mistakeType);
}
