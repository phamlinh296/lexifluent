package org.linh.lexi.ai.repository;

import org.linh.lexi.ai.domain.AiUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.UUID;

public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, Long> {

    @Query("SELECT COALESCE(SUM(u.promptTokens + u.completionTokens), 0) FROM AiUsageLog u WHERE u.userId = :userId AND u.usageDate = :date")
    long sumTokensByUserAndDate(UUID userId, LocalDate date);
}
