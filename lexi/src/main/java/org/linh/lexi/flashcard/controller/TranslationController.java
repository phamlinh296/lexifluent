package org.linh.lexi.flashcard.controller;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.ai.schema.TranslationFeedbackSchema;
import org.linh.lexi.common.response.ApiResponse;
import org.linh.lexi.common.security.LexiUserPrincipal;
import org.linh.lexi.flashcard.dto.AnalyzeTranslationRequest;
import org.linh.lexi.flashcard.service.TranslationAnalysisService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/translate")
@RequiredArgsConstructor
public class TranslationController {

    private final TranslationAnalysisService translationAnalysisService;

    @PostMapping("/analyze")
    public ApiResponse<TranslationFeedbackSchema> analyze(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @RequestBody AnalyzeTranslationRequest request) {
        return ApiResponse.ok(translationAnalysisService.analyzeStandalone(principal.userId(), request));
    }
}
