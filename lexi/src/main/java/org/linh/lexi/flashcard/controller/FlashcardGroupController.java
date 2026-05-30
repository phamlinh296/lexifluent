package org.linh.lexi.flashcard.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.linh.lexi.common.response.ApiResponse;
import org.linh.lexi.common.security.LexiUserPrincipal;
import org.linh.lexi.flashcard.dto.CreateFlashcardGroupRequest;
import org.linh.lexi.flashcard.dto.FlashcardDto;
import org.linh.lexi.flashcard.dto.FlashcardGroupDto;
import org.linh.lexi.flashcard.service.FlashcardGroupService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/flashcard-groups")
@RequiredArgsConstructor
public class FlashcardGroupController {

    private final FlashcardGroupService service;

    @GetMapping
    public ApiResponse<List<FlashcardGroupDto>> list(
            @AuthenticationPrincipal LexiUserPrincipal principal) {
        return ApiResponse.ok(service.list(principal.userId()));
    }

    @PostMapping
    public ApiResponse<FlashcardGroupDto> create(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @Valid @RequestBody CreateFlashcardGroupRequest request) {
        return ApiResponse.ok(service.create(principal.userId(), request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID id) {
        service.delete(principal.userId(), id);
        return ApiResponse.ok(null);
    }

    @GetMapping("/{id}/cards")
    public ApiResponse<List<FlashcardDto>> listCards(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID id) {
        return ApiResponse.ok(service.listCards(principal.userId(), id));
    }

    @PostMapping("/{id}/cards/{cardId}")
    public ApiResponse<FlashcardDto> addCard(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID id,
            @PathVariable UUID cardId) {
        return ApiResponse.ok(service.addCard(principal.userId(), id, cardId));
    }

    @DeleteMapping("/{id}/cards/{cardId}")
    public ApiResponse<FlashcardDto> removeCard(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID id,
            @PathVariable UUID cardId) {
        return ApiResponse.ok(service.removeCard(principal.userId(), id, cardId));
    }
}
