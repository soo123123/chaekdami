package com.chaekdami.reading.presentation;

import com.chaekdami.reading.application.ReadingStatsResult;
import com.chaekdami.reading.application.ReadingStatsService;
import com.chaekdami.reading.application.TodayReadingService;
import com.chaekdami.reading.application.TodayReadingSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class TodayReadingController {

    private final TodayReadingService todayReadingService;
    private final ReadingStatsService readingStatsService;

    @GetMapping("/api/me/reading-today")
    public TodayReadingSummary today(@RequestHeader("X-User-Id") Long userId) {
        return todayReadingService.today(userId);
    }

    @GetMapping("/api/me/reading-stats")
    public ReadingStatsResult stats(@RequestHeader("X-User-Id") Long userId) {
        return readingStatsService.stats(userId);
    }
}
