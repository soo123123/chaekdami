package com.chaekdami.reminder.application.result;

import java.time.LocalDate;
import java.util.List;

/**
 * 알림 예약에 필요한 값. 날짜는 한국 날짜, 독서는 종료 시각 기준이다. (스펙 014 R4.1)
 *
 * @param weekReadDates 이번 주 읽은 날 (오름차순)
 * @param todayMinutes  오늘 읽은 초를 모두 더한 뒤 분으로 내림
 * @param weekMinutes   이번 주 읽은 초를 모두 더한 뒤 분으로 내림
 * @param currentStreak 놓친 날을 방어권으로 처리한 뒤의 연속 일수 (오늘 기록이 없으면 어제까지)
 */
public record ReminderStatusResult(
        LocalDate today,
        LocalDate weekStart,
        boolean readToday,
        List<LocalDate> weekReadDates,
        int todayMinutes,
        int weekMinutes,
        int currentStreak,
        int ownedShieldCount,
        String nickname,
        ReminderSettingResult settings
) {
}
