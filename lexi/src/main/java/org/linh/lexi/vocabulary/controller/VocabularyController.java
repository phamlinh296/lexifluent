package org.linh.lexi.vocabulary.controller;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.common.response.ApiResponse;
import org.linh.lexi.common.response.PageResponse;
import org.linh.lexi.common.security.LexiUserPrincipal;
import org.linh.lexi.vocabulary.domain.VocabularyItem;
import org.linh.lexi.vocabulary.repository.VocabularyItemRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/vocabulary")
@RequiredArgsConstructor
public class VocabularyController {

    private final VocabularyItemRepository vocabularyItemRepository;

    @GetMapping
    public ApiResponse<PageResponse<VocabularyItem>> list(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.ok(PageResponse.of(
                vocabularyItemRepository.findByUserIdOrderByCreatedAtDesc(
                        principal.userId(), PageRequest.of(page, size))));
    }

    @GetMapping("/weak")
    public ApiResponse<PageResponse<VocabularyItem>> weakVocabulary(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(PageResponse.of(
                vocabularyItemRepository.findByUserIdAndMasteredFalseOrderByEncounterCountDesc(
                        principal.userId(), PageRequest.of(page, size))));
    }
}
