package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.application.RewardCleanupService;
import com.chaekdami.user.application.event.UserWithdrawnEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 회원 탈퇴 시 같은 트랜잭션에서 사용자의 보상 데이터를 지운다.
 */
@Component
@RequiredArgsConstructor
public class RewardCleanupListener {

    private final RewardCleanupService rewardCleanupService;

    @EventListener
    public void onUserWithdrawn(UserWithdrawnEvent event) {
        rewardCleanupService.deleteAllOfUser(event.userId());
    }
}
