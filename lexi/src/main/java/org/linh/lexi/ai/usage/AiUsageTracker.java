package org.linh.lexi.ai.usage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.ai.domain.AiUsageLog;
import org.linh.lexi.ai.provider.AiCompletion;
import org.linh.lexi.ai.repository.AiUsageLogRepository;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiUsageTracker {

    private static final String QUOTA_KEY_PREFIX = "quota:daily:";

    private final RedisTemplate<String, Object> redisTemplate;
    private final AiUsageLogRepository usageLogRepository;

    @Value("${lexi.ai.quota.daily-tokens-per-user:50000}")
    private int dailyTokenQuota;

    public void checkQuota(UUID userId) {
        long used;
        try {
            used = getDailyUsage(userId);
        } catch (LexiException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Redis unavailable, skipping quota check for user {}: {}", userId, ex.getMessage());
            return;
        }
        if (used >= dailyTokenQuota) {
            throw new LexiException(ErrorCode.AI_QUOTA_EXCEEDED);
        }
    }

    @Async("analyticsExecutor")
    public void track(UUID userId, UUID aiRequestId, AiCompletion completion) {
        int total = completion.getPromptTokens() + completion.getCompletionTokens();
        try {
            incrementDailyUsage(userId, total);
        } catch (Exception ex) {
            log.warn("Redis unavailable, quota tracking skipped for user {}: {}", userId, ex.getMessage());
        }
        persistUsageLog(userId, aiRequestId, completion);
    }

    public long getDailyUsage(UUID userId) {
        String key = buildQuotaKey(userId);
        Object val = redisTemplate.opsForValue().get(key);
        return val == null ? 0L : Long.parseLong(val.toString());
    }

    private void incrementDailyUsage(UUID userId, int tokens) {
        String key = buildQuotaKey(userId);
        redisTemplate.opsForValue().increment(key, tokens);
        redisTemplate.expire(key, Duration.ofDays(1));
    }

    private void persistUsageLog(UUID userId, UUID aiRequestId, AiCompletion completion) {
        try {
            usageLogRepository.save(AiUsageLog.builder()
                    .userId(userId)
                    .aiRequestId(aiRequestId)
                    .provider(completion.getProvider().name())
                    .model(completion.getModel())
                    .promptTokens(completion.getPromptTokens())
                    .completionTokens(completion.getCompletionTokens())
                    .build());
        } catch (Exception ex) {
            log.error("Failed to persist AI usage log: {}", ex.getMessage());
        }
    }

    private String buildQuotaKey(UUID userId) {
        return QUOTA_KEY_PREFIX + userId + ":" + LocalDate.now();
    }
}
