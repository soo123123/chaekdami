package com.chaekdami.reward.application.port;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 독서 도메인(BE1)의 세션 정보를 읽는 포트. 보상 계산에 필요한 값은 클라이언트가 아니라 저장된 세션에서 가져온다.
 */
public interface ReadingSessionReader {

    /**
     * 요청자 본인의 세션만 돌려준다. 다른 사용자의 세션이거나 없으면 empty.
     */
    Optional<Session> findOwnSession(Long userId, Long readingSessionId);

    /**
     * @param durationSeconds 검증된 독서 시간(초). 독서 도메인이 1초 ~ 2시간으로 검증한다.
     * @param endedAt         세션 종료 시각. 퀘스트·D-day 날짜 기준으로 쓴다.
     */
    record Session(
            Long id,
            int durationSeconds,
            int startPage,
            int endPage,
            LocalDateTime endedAt
    ) {
    }
}
