package org.linh.lexi.auth.handler;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.linh.lexi.auth.dto.AuthResponse;
import org.linh.lexi.auth.service.OAuthCodeService;
import org.linh.lexi.auth.service.RefreshTokenService;
import org.linh.lexi.common.security.JwtService;
import org.linh.lexi.user.domain.AuthProvider;
import org.linh.lexi.user.domain.User;
import org.linh.lexi.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final OAuthCodeService oAuthCodeService;

    @Value("${lexi.oauth2.redirect-uri:http://localhost:3000/oauth/callback}")
    private String redirectUri;

    @Value("${lexi.jwt.access-expiry}")
    private long accessExpiry;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email    = oAuth2User.getAttribute("email");
        String googleId = oAuth2User.getAttribute("sub");
        String name     = oAuth2User.getAttribute("name");
        String picture  = oAuth2User.getAttribute("picture");

        // Find or create user — Google chỉ dùng để verify identity
        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
                .map(existing -> {
                    // Update Google info nếu chưa có
                    if (existing.getGoogleId() == null) {
                        existing.setGoogleId(googleId);
                        existing.setAvatarUrl(picture);
                    }
                    return userRepository.save(existing);
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .email(email)
                        .displayName(name)
                        .avatarUrl(picture)
                        .provider(AuthProvider.GOOGLE)
                        .googleId(googleId)
                        .onboarded(false)
                        .build()));

        if (!user.isActive()) {
            response.sendRedirect(redirectUri + "?error=account_disabled");
            return;
        }

        // Issue INTERNAL tokens — không dùng Google token
        String accessToken  = jwtService.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name(),
                user.getProvider().name(), user.getTokenVersion());
        String refreshToken = refreshTokenService.create(
                user.getId(), request.getHeader("User-Agent"));

        log.info("OAuth2 login success: userId={} provider=GOOGLE", user.getId());

        // Tokens không đi qua URL — tạo short-lived code (30s, one-time use)
        // Frontend sẽ POST /api/v1/auth/oauth2/exchange để lấy tokens thực sự
        AuthResponse auth = new AuthResponse(
                user.getId(), user.getEmail(), user.getDisplayName(),
                accessToken, refreshToken, accessExpiry);
        String code = oAuthCodeService.createCode(auth);

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("code", code)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
