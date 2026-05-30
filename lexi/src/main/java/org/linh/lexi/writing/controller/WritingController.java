package org.linh.lexi.writing.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.linh.lexi.common.response.ApiResponse;
import org.linh.lexi.common.response.PageResponse;
import org.linh.lexi.common.security.LexiUserPrincipal;
import org.linh.lexi.writing.domain.WritingMode;
import org.linh.lexi.writing.dto.SaveDraftRequest;
import org.linh.lexi.writing.dto.SubmitWritingRequest;
import org.linh.lexi.writing.dto.WritingEntryDto;
import org.linh.lexi.writing.service.WritingService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/writing")
@RequiredArgsConstructor
public class WritingController {

    private final WritingService writingService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<WritingEntryDto> submit(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @Valid @RequestBody SubmitWritingRequest request) {
        return ApiResponse.ok(writingService.submit(principal.userId(), request));
    }

    @PostMapping("/draft")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<WritingEntryDto> saveDraft(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @Valid @RequestBody SaveDraftRequest request) {
        return ApiResponse.ok(writingService.saveDraft(principal.userId(), request));
    }

    @PutMapping("/{id}/draft")
    public ApiResponse<WritingEntryDto> updateDraft(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody SaveDraftRequest request) {
        return ApiResponse.ok(writingService.updateDraft(principal.userId(), id, request));
    }

    @PostMapping("/{id}/submit")
    public ApiResponse<WritingEntryDto> submitDraft(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID id) {
        return ApiResponse.ok(writingService.submitDraft(principal.userId(), id));
    }

    @GetMapping
    public ApiResponse<PageResponse<WritingEntryDto>> list(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @RequestParam(required = false) WritingMode mode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(writingService.listByUser(
                principal.userId(), mode, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ApiResponse<WritingEntryDto> getById(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID id) {
        return ApiResponse.ok(writingService.getById(principal.userId(), id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @PathVariable UUID id) {
        writingService.softDelete(principal.userId(), id);
    }
}
