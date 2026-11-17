package com.chaekdami.reward.presentation;

import com.chaekdami.reward.application.RewardService;
import com.chaekdami.reward.application.RewardStatusResult;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final RewardService rewardService;

    @GetMapping
    public RewardStatusResult status(@RequestHeader("X-User-Id") Long userId) {
        return rewardService.getRewardStatus(userId);
    }
}
