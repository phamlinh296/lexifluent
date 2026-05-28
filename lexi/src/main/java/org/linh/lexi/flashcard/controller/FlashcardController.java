package org.linh.lexi.flashcard.controller;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.common.response.ApiResponse;
import org.linh.lexi.common.security.LexiUserPrincipal;
import org.linh.lexi.flashcard.dto.CreateFlashcardRequest;
import org.linh.lexi.flashcard.dto.FlashcardDto;
import org.linh.lexi.flashcard.dto.ReviewFlashcardRequest;
import org.linh.lexi.flashcard.service.FlashcardService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService service;

    @PostMapping
    public ApiResponse<FlashcardDto> create(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @RequestBody CreateFlashcardRequest request) {
        return ApiResponse.ok(service.create(principal.userId(), request));
    }

    @GetMapping
    public ApiResponse<List<FlashcardDto>> list(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @RequestParam(defaultValue = "false") boolean dueOnly) {
        List<FlashcardDto> cards = dueOnly
                ? service.listDue(principal.userId())
                : service.listAll(principal.userId());
        return ApiResponse.ok(cards);
    }

    @PostMapping("/{id}/review")
    public ApiResponse<FlashcardDto> review(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID id,
            @RequestBody ReviewFlashcardRequest request) {
        return ApiResponse.ok(service.review(principal.userId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID id) {
        service.delete(principal.userId(), id);
        return ApiResponse.ok(null);
    }
}
