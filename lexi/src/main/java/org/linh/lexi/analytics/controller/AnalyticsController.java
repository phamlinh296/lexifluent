package org.linh.lexi.analytics.controller;

import lombok.RequiredArgsConstructor;
import org.linh.lexi.analytics.domain.UserProgress;
import org.linh.lexi.analytics.dto.CalendarDayDto;
import org.linh.lexi.analytics.repository.UserProgressRepository;
import org.linh.lexi.analytics.service.AnalyticsService;
import org.linh.lexi.common.exception.ErrorCode;
import org.linh.lexi.common.exception.LexiException;
import org.linh.lexi.common.response.ApiResponse;
import org.linh.lexi.common.security.LexiUserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final UserProgressRepository userProgressRepository;
    private final AnalyticsService analyticsService;

    @GetMapping("/progress")
    public ApiResponse<UserProgress> getProgress(@AuthenticationPrincipal LexiUserPrincipal principal) {
        UserProgress progress = userProgressRepository.findByUserId(principal.userId())
                .orElseThrow(() -> new LexiException(ErrorCode.RESOURCE_NOT_FOUND, "Progress not found"));
        return ApiResponse.ok(progress);
    }

    @GetMapping("/calendar")
    public ApiResponse<List<CalendarDayDto>> getCalendar(
            @AuthenticationPrincipal LexiUserPrincipal principal,
            @RequestParam(defaultValue = "90") int days) {
        return ApiResponse.ok(analyticsService.getCalendar(principal.userId(), days));
    }
}
