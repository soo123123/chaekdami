package com.chaekdami.reward.presentation;

import com.chaekdami.reward.application.BoosterService;
import com.chaekdami.reward.application.BoosterUseResult;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 경험치 부스터 사용 API. 보유한 부스터 1개를 써서 30분 동안 독서 경험치를 2배로 만든다.
 * 부스터가 없으면 400 REWARD_006.
 */
@RestController
@RequestMapping("/api/rewards/boosters")
@RequiredArgsConstructor
public class BoosterController {

    private final BoosterService boosterService;

    @PostMapping("/use")
    public BoosterUseResult use(@RequestHeader("X-User-Id") Long userId) {
        return boosterService.use(userId);
    }
}
