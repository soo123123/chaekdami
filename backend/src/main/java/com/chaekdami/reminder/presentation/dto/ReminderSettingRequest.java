package com.chaekdami.reminder.presentation.dto;

import com.chaekdami.reminder.domain.ReminderSetting;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ReminderSettingRequest {

    @NotNull(message = "알림 켜기 여부를 보내야 합니다.")
    private Boolean enabled;

    @NotNull(message = "이른 아침·늦은 저녁 알림 끄기 여부를 보내야 합니다.")
    private Boolean earlyLateMuted;

    @NotNull(message = "주간 목표를 보내야 합니다.")
    @Min(value = ReminderSetting.MIN_WEEKLY_GOAL_MINUTES, message = "주간 목표는 30분 이상이어야 합니다.")
    @Max(value = ReminderSetting.MAX_WEEKLY_GOAL_MINUTES, message = "주간 목표는 3000분 이하여야 합니다.")
    private Integer weeklyGoalMinutes;
}
