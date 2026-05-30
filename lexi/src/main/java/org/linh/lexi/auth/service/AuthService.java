package org.linh.lexi.auth.service;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.auth.dto.AuthResponse;
import org.linh.lexi.auth.dto.LoginRequest;
import org.linh.lexi.auth.dto.RegisterRequest;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.linh.lexi.common.security.JwtService;
import org.linh.lexi.user.domain.AuthProvider;
import org.linh.lexi.user.domain.User;
import org.linh.lexi.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Value("${lexi.jwt.access-expiry}")
    private long accessExpiry;

    @Transactional
    public AuthResponse register(RegisterRequest request, String deviceInfo) {
        if (userRepository.existsByEmailAndDeletedAtIsNull(request.email())) {
            throw new LexiException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        User user = User.builder()
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .displayName(request.displayName())
                .provider(AuthProvider.LOCAL)
                .build();
        userRepository.save(user);
        return buildAuthResponse(user, deviceInfo);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String deviceInfo) {
        User user = userRepository.findByEmailAndDeletedAtIsNull(request.email().toLowerCase())
                .orElseThrow(() -> new LexiException(ErrorCode.INVALID_CREDENTIALS));
        if (!user.isActive()) {
            throw new LexiException(ErrorCode.ACCOUNT_DISABLED);
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new LexiException(ErrorCode.INVALID_CREDENTIALS);
        }
        return buildAuthResponse(user, deviceInfo);
    }

    @Transactional
    public AuthResponse refresh(String rawToken, String deviceInfo) {
        UUID userId = refreshTokenService.validateAndRotate(rawToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new LexiException(ErrorCode.USER_NOT_FOUND));
        if (!user.isActive()) {
            throw new LexiException(ErrorCode.ACCOUNT_DISABLED);
        }
        return buildAuthResponse(user, deviceInfo);
    }

    @Transactional
    public void logout(UUID userId) {
        refreshTokenService.revokeAll(userId);
    }

    @Transactional
    public void logoutAll(UUID userId) {
        refreshTokenService.revokeAll(userId);
        userRepository.findById(userId).ifPresent(user -> {
            user.incrementTokenVersion();
            userRepository.save(user);
        });
    }

    private AuthResponse buildAuthResponse(User user, String deviceInfo) {
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name(),
                user.getProvider().name(), user.getTokenVersion());
        String refreshToken = refreshTokenService.create(user.getId(), deviceInfo);

        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                accessToken,
                refreshToken,
                accessExpiry
        );
    }
}
