package com.chaekdami.dday.infrastructure;

import com.chaekdami.dday.application.DdayService;
import com.chaekdami.user.application.event.UserWithdrawnEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 회원 탈퇴 시 같은 트랜잭션에서 사용자의 D-day 목표와 달력 기록을 지운다.
 */
@Component
@RequiredArgsConstructor
public class DdayCleanupListener {

    private final DdayService ddayService;

    @EventListener
    public void onUserWithdrawn(UserWithdrawnEvent event) {
        ddayService.deleteAllOfUser(event.userId());
    }
}
