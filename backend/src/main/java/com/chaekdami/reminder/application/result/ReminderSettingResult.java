package com.chaekdami.reminder.application.result;

import com.chaekdami.reminder.domain.ReminderSetting;

public record ReminderSettingResult(boolean enabled, boolean earlyLateMuted, int weeklyGoalMinutes) {

    public static ReminderSettingResult from(ReminderSetting setting) {
        return new ReminderSettingResult(setting.isEnabled(), setting.isEarlyLateMuted(), setting.getWeeklyGoalMinutes());
    }

    public static ReminderSettingResult defaults() {
        return new ReminderSettingResult(ReminderSetting.DEFAULT_ENABLED, ReminderSetting.DEFAULT_EARLY_LATE_MUTED,
                ReminderSetting.DEFAULT_WEEKLY_GOAL_MINUTES);
    }
}
