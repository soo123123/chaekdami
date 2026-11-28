package com.chaekdami.reminder.application.port;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 독서 도메인(BE1)의 세션을 읽는 포트. 기간은 세션 종료 시각(ended_at) 기준 [start, end) 이다. (스펙 014 R4.3)
 */
public interface ReminderReadingReader {

    List<EndedSession> findEndedBetween(Long userId, LocalDateTime start, LocalDateTime end);

    /**
     * @param endedAt         서버 시간대의 로컬 시각
     * @param durationSeconds 읽은 시간(초)
     */
    record EndedSession(LocalDateTime endedAt, int durationSeconds) {
    }
}
