package org.linh.lexi.review.controller;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.common.response.ApiResponse;
import org.linh.lexi.common.security.LexiUserPrincipal;
import org.linh.lexi.review.dto.RecurringMistakeDto;
import org.linh.lexi.review.repository.RecurringMistakeRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/mistakes")
@RequiredArgsConstructor
public class MistakeController {

    private final RecurringMistakeRepository mistakeRepository;

    @GetMapping
    public ApiResponse<List<RecurringMistakeDto>> list(@AuthenticationPrincipal LexiUserPrincipal principal) {
        List<RecurringMistakeDto> mistakes = mistakeRepository
                .findByUserIdOrderByOccurrenceCountDesc(principal.userId())
                .stream()
                .map(RecurringMistakeDto::from)
                .toList();
        return ApiResponse.ok(mistakes);
    }
}
