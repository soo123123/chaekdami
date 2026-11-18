package com.chaekdami.reward.domain;

import java.time.LocalDate;
import java.util.Map;
import java.util.TreeMap;

/**
 * D-day 달력 기록으로 연속 독서 일수를 계산한다.
 * - 달력의 하루는 "읽음"(true) 또는 "방어"(false)다. 기록이 없는 날에서 연속이 끊긴다.
 * - 읽은 날은 +1, 방어권으로 막은 날은 +0 이다. (끊기지만 않게 하고 일수는 늘리지 않음)
 */
public final class StreakCalculator {

    private StreakCalculator() {
    }

    /**
     * @param currentStreak 오늘(오늘 기록이 없으면 어제)까지 이어진 연속 일수
     * @param longestStreak 지금까지 가장 길었던 연속 일수
     */
    public record Summary(int currentStreak, int longestStreak) {
    }

    /**
     * @param days 날짜별 기록. true = 읽음, false = 방어
     */
    public static Summary summarize(Map<LocalDate, Boolean> days, LocalDate today) {
        int longest = 0;
        int run = 0;
        LocalDate previous = null;
        for (Map.Entry<LocalDate, Boolean> day : new TreeMap<>(days).entrySet()) {
            int value = Boolean.TRUE.equals(day.getValue()) ? 1 : 0;
            run = previous != null && previous.plusDays(1).equals(day.getKey()) ? run + value : value;
            longest = Math.max(longest, run);
            previous = day.getKey();
        }

        LocalDate end = days.containsKey(today) ? today : today.minusDays(1);
        return new Summary(streakEndingAt(days, end), longest);
    }

    /**
     * day 에서 끝나는 연속 구간의 일수. day 에 기록이 없으면 0
     */
    public static int streakEndingAt(Map<LocalDate, Boolean> days, LocalDate day) {
        int streak = 0;
        for (LocalDate cursor = day; days.containsKey(cursor); cursor = cursor.minusDays(1)) {
            if (Boolean.TRUE.equals(days.get(cursor))) {
                streak++;
            }
        }
        return streak;
    }
}
