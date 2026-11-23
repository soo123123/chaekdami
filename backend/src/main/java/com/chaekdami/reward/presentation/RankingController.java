package com.chaekdami.reward.presentation;

import com.chaekdami.reward.application.RankingService;
import com.chaekdami.reward.application.WeeklyRankingResult;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rewards/rankings")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    /**
     * 이번 주(한국 시간 월~일) 경험치 랭킹. 상위 30명과 내 순위. score = 경험치
     */
    @GetMapping("/weekly/experience")
    public WeeklyRankingResult weeklyExperience(@RequestHeader("X-User-Id") Long userId) {
        return rankingService.getWeeklyExperienceRanking(userId);
    }

    /**
     * 이번 주(한국 시간 월~일) 독서 시간 랭킹. 상위 30명과 내 순위. score = 독서 시간(초)
     */
    @GetMapping("/weekly/reading-time")
    public WeeklyRankingResult weeklyReadingTime(@RequestHeader("X-User-Id") Long userId) {
        return rankingService.getWeeklyReadingTimeRanking(userId);
    }
}
