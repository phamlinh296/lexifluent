package org.linh.lexi.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.linh.lexi.auth.dto.AuthResponse;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * Short-lived one-time code exchange for OAuth2 callback.
 * Prevents access/refresh tokens from appearing in browser history or server logs.
 *
 * Flow: OAuth2 callback → generate code (30s TTL) → redirect ?code=xxx
 *       Frontend POST /auth/oauth2/exchange → receives real tokens in response body
 */
@Service
@RequiredArgsConstructor
public class OAuthCodeService {

    private static final String CODE_PREFIX = "oauth2:code:";
    private static final Duration CODE_TTL = Duration.ofSeconds(30);

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public String createCode(AuthResponse auth) {
        String code = UUID.randomUUID().toString().replace("-", "");
        redisTemplate.opsForValue().set(CODE_PREFIX + code, auth, CODE_TTL);
        return code;
    }

    public AuthResponse exchangeCode(String code) {
        Object value = redisTemplate.opsForValue().getAndDelete(CODE_PREFIX + code);
        if (value == null) {
            throw new LexiException(ErrorCode.TOKEN_INVALID);
        }
        return objectMapper.convertValue(value, AuthResponse.class);
    }
}
