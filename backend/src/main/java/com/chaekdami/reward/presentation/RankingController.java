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
     * 이번 주(한국 시간 월~일) 경험치 랭킹. 상위 30명과 내 순위.
     */
    @GetMapping("/weekly")
    public WeeklyRankingResult weekly(@RequestHeader("X-User-Id") Long userId) {
        return rankingService.getWeeklyRanking(userId);
    }
}
