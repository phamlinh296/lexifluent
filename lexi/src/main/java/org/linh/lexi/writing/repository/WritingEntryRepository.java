package org.linh.lexi.writing.repository;

import org.linh.lexi.writing.domain.WritingEntry;
import org.linh.lexi.writing.domain.WritingMode;
import org.linh.lexi.writing.domain.WritingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface WritingEntryRepository extends JpaRepository<WritingEntry, UUID> {

    Page<WritingEntry> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<WritingEntry> findByUserIdAndModeAndDeletedAtIsNullOrderByCreatedAtDesc(
            UUID userId, WritingMode mode, Pageable pageable);

    Optional<WritingEntry> findByIdAndUserIdAndDeletedAtIsNull(UUID id, UUID userId);

    @Query("SELECT e FROM WritingEntry e WHERE e.status = :status AND e.deletedAt IS NULL ORDER BY e.submittedAt ASC")
    Page<WritingEntry> findByStatus(WritingStatus status, Pageable pageable);
}
