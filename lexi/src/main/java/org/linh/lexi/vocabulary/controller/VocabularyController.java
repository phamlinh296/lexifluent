package org.linh.lexi.vocabulary.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.linh.lexi.common.response.ApiResponse;
import org.linh.lexi.common.response.PageResponse;
import org.linh.lexi.common.security.LexiUserPrincipal;
import org.linh.lexi.vocabulary.domain.VocabularyItem;
import org.linh.lexi.vocabulary.dto.ManualAddVocabRequest;
import org.linh.lexi.vocabulary.dto.TopicCountDto;
import org.linh.lexi.flashcard.dto.FlashcardDto;
import org.linh.lexi.flashcard.service.FlashcardGroupService;
import org.linh.lexi.vocabulary.repository.VocabularyItemRepository;
import org.linh.lexi.vocabulary.service.VocabularyEnrichmentService;
import org.linh.lexi.vocabulary.service.VocabularyService;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vocabulary")
@RequiredArgsConstructor
public class VocabularyController {

    private final VocabularyItemRepository vocabularyItemRepository;
    private final VocabularyService vocabularyService;
    private final VocabularyEnrichmentService enrichmentService;
    private final FlashcardGroupService flashcardGroupService;

    // AI enriches word → classify topic, definition, example sentence, CEFR
    // If word already exists for user → returns existing (no AI call)
    @PostMapping
    public ApiResponse<VocabularyItem> add(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @Valid @RequestBody ManualAddVocabRequest request) {
        return ApiResponse.ok(enrichmentService.addManually(principal.userId(), request.word()));
    }

    // ?topic=education filters by topic; omit for all
    @GetMapping
    public ApiResponse<PageResponse<VocabularyItem>> list(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @RequestParam(required = false) String topic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.ok(PageResponse.of(
                vocabularyService.list(principal.userId(), topic, PageRequest.of(page, size))));
    }

    @GetMapping("/topics")
    public ApiResponse<List<TopicCountDto>> topics(
            @AuthenticationPrincipal LexiUserPrincipal principal) {
        return ApiResponse.ok(vocabularyService.getTopicStats(principal.userId()));
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

    // Creates BASIC flashcard from vocab (if not exists) and adds it to the group
    @PostMapping("/{vocabId}/flashcard-groups/{groupId}")
    public ApiResponse<FlashcardDto> addToGroup(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID vocabId,
            @PathVariable UUID groupId) {
        return ApiResponse.ok(flashcardGroupService.addVocabToGroup(principal.userId(), vocabId, groupId));
    }

    @PatchMapping("/{id}/master")
    public ApiResponse<VocabularyItem> markMastered(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "true") boolean mastered) {
        return ApiResponse.ok(vocabularyService.markMastered(principal.userId(), id, mastered));
    }
}
