package org.linh.lexi.user.controller;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.linh.lexi.common.response.ApiResponse;
import org.linh.lexi.common.security.LexiUserPrincipal;
import org.linh.lexi.user.domain.User;
import org.linh.lexi.user.dto.UpdateProfileRequest;
import org.linh.lexi.user.dto.UserSettingsRequest;
import org.linh.lexi.user.repository.UserRepository;
import org.linh.lexi.user.util.UserApiKeyEncryptor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserApiKeyEncryptor encryptor;

    @GetMapping("/me")
    public ApiResponse<User> getMe(@AuthenticationPrincipal LexiUserPrincipal principal) {
        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new LexiException(ErrorCode.USER_NOT_FOUND));
        return ApiResponse.ok(user);
    }

    @PatchMapping("/me")
    public ApiResponse<User> updateProfile(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @RequestBody UpdateProfileRequest request) {
        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new LexiException(ErrorCode.USER_NOT_FOUND));
        if (request.displayName() != null) user.setDisplayName(request.displayName());
        if (request.cefrLevel() != null) user.setCefrLevel(request.cefrLevel());
        userRepository.save(user);
        return ApiResponse.ok(user);
    }

    @PatchMapping("/me/settings")
    public ApiResponse<User> updateSettings(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @RequestBody UserSettingsRequest request) {
        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new LexiException(ErrorCode.USER_NOT_FOUND));

        if (request.openaiApiKey() != null) {
            user.setOpenaiApiKeyEncrypted(
                    request.openaiApiKey().isBlank() ? null : encryptor.encrypt(request.openaiApiKey()));
        }
        if (request.geminiApiKey() != null) {
            user.setGeminiApiKeyEncrypted(
                    request.geminiApiKey().isBlank() ? null : encryptor.encrypt(request.geminiApiKey()));
        }
        userRepository.save(user);
        return ApiResponse.ok(user);
    }
}
