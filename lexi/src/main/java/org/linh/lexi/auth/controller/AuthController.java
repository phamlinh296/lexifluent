package org.linh.lexi.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.linh.lexi.auth.dto.AuthResponse;
import org.linh.lexi.auth.dto.LoginRequest;
import org.linh.lexi.auth.dto.RegisterRequest;
import org.linh.lexi.auth.service.AuthService;
import org.linh.lexi.auth.service.OAuthCodeService;
import org.linh.lexi.common.response.ApiResponse;
import org.linh.lexi.common.security.LexiUserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OAuthCodeService oAuthCodeService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
                                              HttpServletRequest httpRequest) {
        return ApiResponse.ok(authService.register(request, httpRequest.getHeader("User-Agent")));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                           HttpServletRequest httpRequest) {
        return ApiResponse.ok(authService.login(request, httpRequest.getHeader("User-Agent")));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@RequestParam String token,
                                             HttpServletRequest httpRequest) {
        return ApiResponse.ok(authService.refresh(token, httpRequest.getHeader("User-Agent")));
    }

    @PostMapping("/oauth2/exchange")
    public ApiResponse<AuthResponse> exchangeOAuthCode(@RequestParam String code) {
        return ApiResponse.ok(oAuthCodeService.exchangeCode(code));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@AuthenticationPrincipal LexiUserPrincipal principal) {
        authService.logout(principal.userId());
    }

    @PostMapping("/logout-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logoutAll(@AuthenticationPrincipal LexiUserPrincipal principal) {
        authService.logoutAll(principal.userId());
    }
}
