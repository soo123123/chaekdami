package com.chaekdami.reward.application;

/**
 * 독서 성공 기록 결과
 *
 * @param currentStreak 현재 연속 독서 일수
 * @param maxStreak     최고 연속 독서 일수
 * @param shieldsUsed   이번 기록 전에 놓친 날을 막느라 자동 차감된 방어권 수
 * @param newlyAchieved 오늘 처음 성공한 기록인지 (오늘 이미 성공했으면 false)
 */
public record StreakResult(
        int currentStreak,
        int maxStreak,
        int shieldsUsed,
        boolean newlyAchieved
) {
}
