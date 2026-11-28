package com.chaekdami.reminder.presentation;

import com.chaekdami.reminder.application.ReminderSettingService;
import com.chaekdami.reminder.application.ReminderStatusService;
import com.chaekdami.reminder.application.result.ReminderSettingResult;
import com.chaekdami.reminder.application.result.ReminderStatusResult;
import com.chaekdami.reminder.presentation.dto.ReminderSettingRequest;
import com.chaekdami.user.application.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 독서 알림 (스펙 014). 알림 예약은 앱이 하고, 서버는 예약에 필요한 값과 설정만 준다.
 */
@RestController
@RequiredArgsConstructor
public class ReminderController {

    private final CurrentUser currentUser;
    private final ReminderStatusService reminderStatusService;
    private final ReminderSettingService reminderSettingService;

    @GetMapping("/api/me/reminder-status")
    public ReminderStatusResult status() {
        return reminderStatusService.get(currentUser.requireId());
    }

    @PutMapping("/api/me/reminder-settings")
    public ReminderSettingResult saveSettings(@RequestBody @Valid ReminderSettingRequest request) {
        return reminderSettingService.save(currentUser.requireId(), request.getEnabled(),
                request.getEarlyLateMuted(), request.getWeeklyGoalMinutes());
    }
}
