package org.linh.lexi.ai.repository;

import org.linh.lexi.ai.domain.AiFeedbackEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AiFeedbackRepository extends JpaRepository<AiFeedbackEntity, UUID> {
    Optional<AiFeedbackEntity> findTopByWritingEntryIdOrderByCreatedAtDesc(UUID writingEntryId);
}
