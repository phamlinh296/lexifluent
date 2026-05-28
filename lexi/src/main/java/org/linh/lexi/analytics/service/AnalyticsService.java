package org.linh.lexi.analytics.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.analytics.domain.UserProgress;
import org.linh.lexi.analytics.domain.WritingAnalytics;
import org.linh.lexi.analytics.dto.CalendarDayDto;
import org.linh.lexi.analytics.dto.FeedbackAnalyticsSnapshot;
import org.linh.lexi.analytics.repository.UserProgressRepository;
import org.linh.lexi.analytics.repository.WritingAnalyticsRepository;
import org.linh.lexi.user.domain.CefrLevel;
import org.linh.lexi.user.domain.User;
import org.linh.lexi.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserProgressRepository userProgressRepository;
    private final WritingAnalyticsRepository writingAnalyticsRepository;
    private final UserRepository userRepository;

    @Transactional
    public void updateAfterFeedback(FeedbackAnalyticsSnapshot snapshot) {
        writingAnalyticsRepository.save(WritingAnalytics.builder()
                .userId(snapshot.userId())
                .writingEntryId(snapshot.writingEntryId())
                .grammarAccuracy(bd(snapshot.grammarAccuracy()))
                .fluencyScore(bd(snapshot.fluencyScore()))
                .lexicalDiversity(bd(snapshot.lexicalDiversity()))
                .naturalnessScore(bd(snapshot.naturalnessScore()))
                .estimatedIeltsBand(bd(snapshot.ieltsBand()))
                .sentenceCount(snapshot.sentenceCount())
                .avgSentenceLength(bd(snapshot.avgSentenceLength()))
                .wordCount(snapshot.wordCount())
                .build());

        UserProgress progress = userProgressRepository.findByUserId(snapshot.userId())
                .orElseGet(() -> UserProgress.builder().userId(snapshot.userId()).build());

        int newCount = progress.getTotalEntries() + 1;
        progress.setTotalEntries(newCount);
        progress.setTotalWordsWritten(progress.getTotalWordsWritten() + snapshot.wordCount());
        progress.setAvgGrammarAccuracy(runningAvg(progress.getAvgGrammarAccuracy(), snapshot.grammarAccuracy(), newCount));
        progress.setAvgFluencyScore(runningAvg(progress.getAvgFluencyScore(), snapshot.fluencyScore(), newCount));
        progress.setAvgLexicalDiversity(runningAvg(progress.getAvgLexicalDiversity(), snapshot.lexicalDiversity(), newCount));

        if (snapshot.ieltsBand() != null) {
            progress.setEstimatedIeltsBand(runningAvg(progress.getEstimatedIeltsBand(), snapshot.ieltsBand(), newCount));
        }
        if (snapshot.estimatedCefrLevel() != null) {
            try { progress.setEstimatedCefr(CefrLevel.valueOf(snapshot.estimatedCefrLevel().toUpperCase())); }
            catch (IllegalArgumentException ignored) {}
        }
        progress.setLastUpdatedAt(Instant.now());

        User user = userRepository.findById(snapshot.userId()).orElse(null);
        if (user != null) {
            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            LocalDate lastActive = user.getLastActiveDate();
            int newStreak;
            if (lastActive == null || lastActive.isBefore(today.minusDays(1))) {
                newStreak = 1;
            } else if (lastActive.equals(today.minusDays(1))) {
                newStreak = user.getWritingStreak() + 1;
            } else {
                newStreak = user.getWritingStreak(); // already wrote today
            }
            user.setWritingStreak(newStreak);
            user.setLastActiveDate(today);
            userRepository.save(user);

            progress.setCurrentStreak(newStreak);
            progress.setLongestStreak(Math.max(progress.getLongestStreak(), newStreak));
        }

        userProgressRepository.save(progress);
        log.debug("Updated analytics for user {}: entries={}, streak={}",
                snapshot.userId(), newCount, progress.getCurrentStreak());
    }

    @Transactional(readOnly = true)
    public List<CalendarDayDto> getCalendar(UUID userId, int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        return writingAnalyticsRepository.findDailyActivitySince(userId.toString(), since)
                .stream()
                .map(row -> new CalendarDayDto(row[0].toString(), ((Number) row[1]).intValue()))
                .toList();
    }

    private BigDecimal runningAvg(BigDecimal oldAvg, Double newValue, int newCount) {
        if (newValue == null) return oldAvg;
        if (oldAvg == null) return BigDecimal.valueOf(newValue).setScale(2, RoundingMode.HALF_UP);
        BigDecimal diff = BigDecimal.valueOf(newValue).subtract(oldAvg);
        return oldAvg.add(diff.divide(BigDecimal.valueOf(newCount), 2, RoundingMode.HALF_UP));
    }

    private BigDecimal bd(Double val) {
        return val == null ? null : BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP);
    }
}
