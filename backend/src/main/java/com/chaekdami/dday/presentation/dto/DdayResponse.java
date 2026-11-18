package com.chaekdami.dday.presentation.dto;

import java.util.List;
import java.util.Map;

/**
 * @param currentStreak 서버가 계산한 현재 연속 독서 일수 (읽은 날 +1, 방어한 날 +0)
 * @param longestStreak 서버가 계산한 최고 연속 독서 일수
 */
public record DdayResponse(
        List<DdayGoalResponse> goals,
        Map<String, String> records,
        int currentStreak,
        int longestStreak
) {
}
