package com.chaekdami.reward.application.port;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 독서 도메인(BE1)의 세션 독서 시간을 기간별로 집계해 읽는 포트. 주간 독서 시간 랭킹에 쓴다.
 * 기간은 세션 종료 시각(ended_at) 기준 [start, end) 이다.
 */
public interface WeeklyReadingTimeReader {

    /**
     * 기간 안 독서 시간(초) 합이 큰 사용자 순서. 같으면 사용자 번호 작은 순. 기간 안 세션이 없는 사용자는 나오지 않는다.
     */
    List<UserSeconds> findTop(LocalDateTime start, LocalDateTime end, int limit);

    /**
     * 한 사용자의 기간 안 독서 시간(초) 합. 없으면 0.
     */
    long sumOf(Long userId, LocalDateTime start, LocalDateTime end);

    /**
     * 기간 안 독서 시간(초) 합이 seconds 보다 큰 사용자 수.
     */
    long countUsersGreaterThan(LocalDateTime start, LocalDateTime end, long seconds);

    record UserSeconds(Long userId, long seconds) {
    }
}
