package com.chaekdami.reading.presentation.dto.response;

import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.domain.ReadingSession;
import com.chaekdami.reading.domain.ReadingStatus;

import java.time.LocalDateTime;

// 독서 세션 저장 결과 (+ 저장 후 회차 상태)
public record ReadingSessionResponse(
        Long id,                    // 세션 번호
        Long readingRecordId,       // 이 세션이 붙은 회차 기록 번호
        Long bookId,                // 서재 책 번호
        Integer readingTime,        // 독서 시간 (초)
        Integer startPage,
        Integer endPage,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        ReadingStatus status,       // 저장 후 회차 상태 (마지막 쪽이면 COMPLETED)
        Integer currentPage,        // 저장 후 현재 페이지
        Integer progressRate        // 저장 후 독서율 (%)
) {

    public static ReadingSessionResponse from(ReadingSession session) {
        ReadingRecord record = session.getReadingRecord();
        return new ReadingSessionResponse(
                session.getId(),
                record.getId(),
                record.getBook().getId(),
                session.getDurationSeconds(),
                session.getStartPage(),
                session.getEndPage(),
                session.getStartedAt(),
                session.getEndedAt(),
                record.getStatus(),
                record.getCurrentPage(),
                record.getProgressRate()
        );
    }
}
