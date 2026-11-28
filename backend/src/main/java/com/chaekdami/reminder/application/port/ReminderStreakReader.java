package com.chaekdami.reminder.application.port;

import java.time.LocalDate;

/**
 * 보상 도메인(BE2)의 연속 독서와 방어권을 읽는 포트. (스펙 014 R4.2)
 */
public interface ReminderStreakReader {

    /**
     * today 전날까지 놓친 날을 방어권으로 처리한 뒤의 연속 일수와 남은 방어권 수.
     * 보상·D-day 조회와 같은 처리라 쓰기가 일어날 수 있다.
     */
    Streak settleAndRead(Long userId, LocalDate today);

    record Streak(int currentStreak, int ownedShieldCount) {
    }
}
