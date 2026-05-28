package org.linh.lexi.ai.repository;

import org.linh.lexi.ai.domain.AiRequestEntity;
import org.linh.lexi.ai.domain.AiRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AiRequestRepository extends JpaRepository<AiRequestEntity, UUID> {
    Optional<AiRequestEntity> findTopByWritingEntryIdAndStatusOrderByCreatedAtDesc(
            UUID writingEntryId, AiRequestStatus status);
    List<AiRequestEntity> findByWritingEntryId(UUID writingEntryId);
}
