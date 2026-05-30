package org.linh.lexi.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.auth.domain.RefreshToken;
import org.linh.lexi.auth.repository.RefreshTokenRepository;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${lexi.jwt.refresh-expiry}")
    private long refreshExpirySeconds;

    public String create(UUID userId, String deviceInfo) {
        String rawToken = UUID.randomUUID().toString() + UUID.randomUUID();
        String tokenHash = hash(rawToken);

        RefreshToken token = RefreshToken.builder()
                .userId(userId)
                .tokenHash(tokenHash)
                .deviceInfo(deviceInfo)
                .expiresAt(Instant.now().plusSeconds(refreshExpirySeconds))
                .build();
        refreshTokenRepository.save(token);

        return rawToken; // chỉ raw token gửi cho client
    }

    @Transactional
    public UUID validateAndRotate(String rawToken) {
        String tokenHash = hash(rawToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new LexiException(ErrorCode.REFRESH_TOKEN_INVALID));

        if (stored.isRevoked()) {
            // Could be token reuse (theft) or a multi-tab race condition.
            // Log for monitoring but don't revoke all sessions — a cascade logout
            // on every multi-tab race would be too disruptive for an MVP.
            log.warn("Refresh token reuse detected for userId={}", stored.getUserId());
            throw new LexiException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        if (stored.isExpired()) {
            throw new LexiException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        // Rotation: revoke token cũ, client sẽ nhận token mới
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return stored.getUserId();
    }

    @Transactional
    public void revokeAll(UUID userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    // Cleanup định kỳ — chạy lúc 3am mỗi ngày
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpired() {
        refreshTokenRepository.deleteExpiredAndRevoked();
        log.info("Cleaned up expired/revoked refresh tokens");
    }

    private String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }
}
