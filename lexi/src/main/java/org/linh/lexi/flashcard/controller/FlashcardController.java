package org.linh.lexi.flashcard.controller;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.ai.schema.TranslationFeedbackSchema;
import org.linh.lexi.common.response.ApiResponse;
import org.linh.lexi.common.security.LexiUserPrincipal;
import org.linh.lexi.flashcard.dto.AnalyzeTranslationRequest;
import org.linh.lexi.flashcard.dto.CreateFlashcardRequest;
import org.linh.lexi.flashcard.dto.FlashcardDto;
import org.linh.lexi.flashcard.dto.FlashcardStatsDto;
import org.linh.lexi.flashcard.dto.ReviewFlashcardRequest;
import org.linh.lexi.flashcard.service.FlashcardService;
import org.linh.lexi.flashcard.service.TranslationAnalysisService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService service;
    private final TranslationAnalysisService translationAnalysisService;

    @PostMapping
    public ApiResponse<FlashcardDto> create(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @RequestBody CreateFlashcardRequest request) {
        return ApiResponse.ok(service.create(principal.userId(), request));
    }

    // dueOnly=true → due cards; favoritesOnly=true → favorites; default → all
    @GetMapping
    public ApiResponse<List<FlashcardDto>> list(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @RequestParam(defaultValue = "false") boolean dueOnly,
            @RequestParam(defaultValue = "false") boolean favoritesOnly) {
        UUID userId = principal.userId();
        List<FlashcardDto> cards;
        if (dueOnly) {
            cards = service.listDue(userId);
        } else if (favoritesOnly) {
            cards = service.listFavorites(userId);
        } else {
            cards = service.listAll(userId);
        }
        return ApiResponse.ok(cards);
    }

    @PatchMapping("/{id}/favorite")
    public ApiResponse<FlashcardDto> toggleFavorite(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID id) {
        return ApiResponse.ok(service.toggleFavorite(principal.userId(), id));
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

    @GetMapping("/stats")
    public ApiResponse<FlashcardStatsDto> stats(
            @AuthenticationPrincipal LexiUserPrincipal principal) {
        return ApiResponse.ok(service.getStats(principal.userId()));
    }

    @PostMapping("/{id}/translate/analyze")
    public ApiResponse<TranslationFeedbackSchema> analyzeTranslation(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID id,
            @RequestBody AnalyzeTranslationRequest request) {
        return ApiResponse.ok(translationAnalysisService.analyze(principal.userId(), id, request));
    }
}
