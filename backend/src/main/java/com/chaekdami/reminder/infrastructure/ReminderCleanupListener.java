package com.chaekdami.reminder.infrastructure;

import com.chaekdami.reminder.application.ReminderSettingService;
import com.chaekdami.user.application.event.UserWithdrawnEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 회원 탈퇴 시 같은 트랜잭션에서 알림 설정을 지운다.
 */
@Component
@RequiredArgsConstructor
public class ReminderCleanupListener {

    private final ReminderSettingService reminderSettingService;

    @EventListener
    public void onUserWithdrawn(UserWithdrawnEvent event) {
        reminderSettingService.deleteAllOfUser(event.userId());
    }
}
