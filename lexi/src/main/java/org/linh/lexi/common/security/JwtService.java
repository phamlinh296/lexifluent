package org.linh.lexi.common.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Component
public class JwtService {

    private final SecretKey signingKey;
    private final long accessExpirySeconds;

    public JwtService(
            @Value("${lexi.jwt.secret}") String secret,
            @Value("${lexi.jwt.access-expiry}") long accessExpirySeconds) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpirySeconds = accessExpirySeconds;
    }

    public String generateAccessToken(UUID userId, String email, String role,
                                      String provider, int tokenVersion) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .claim("provider", provider)
                .claim("tv", tokenVersion)           // tokenVersion — for invalidation
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessExpirySeconds)))
                .signWith(signingKey)
                .compact();
    }

    public Claims validateAndParse(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException ex) {
            throw new LexiException(ErrorCode.TOKEN_EXPIRED);
        } catch (JwtException ex) {
            log.debug("JWT validation failed: {}", ex.getMessage());
            throw new LexiException(ErrorCode.TOKEN_INVALID);
        }
    }

    public UUID extractUserId(Claims claims) {
        return UUID.fromString(claims.getSubject());
    }

    public int extractTokenVersion(Claims claims) {
        return claims.get("tv", Integer.class);
    }
}
