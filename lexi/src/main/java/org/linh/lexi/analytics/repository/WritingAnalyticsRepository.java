package org.linh.lexi.analytics.repository;

import org.linh.lexi.analytics.domain.WritingAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface WritingAnalyticsRepository extends JpaRepository<WritingAnalytics, Long> {

    @Query(nativeQuery = true,
           value = "SELECT DATE(recorded_at) AS date, COUNT(*) AS writing_count " +
                   "FROM writing_analytics WHERE user_id = :userId AND recorded_at >= :since " +
                   "GROUP BY DATE(recorded_at) ORDER BY date")
    List<Object[]> findDailyActivitySince(@Param("userId") String userId, @Param("since") Instant since);
}
