package com.chaekdami.reading.presentation.dto.response;

import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.domain.ReadingStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

// 독서 기록 응답
public record ReadingRecordResponse(
        Long id,                   // readingRecordId
        Long bookId,               // 서재 책 번호
        Integer round,             // 회차
        ReadingStatus status,      // NOT_STARTED / IN_PROGRESS / COMPLETED
        Integer currentPage,       // 현재 페이지
        Integer totalPages,        // 전체 쪽수
        Integer progressRate,      // 독서율 (%)
        LocalDate goalDate,        // 목표 완독 날짜
        Integer goalPage,          // 하루 목표 페이지
        String memo,               // 메모
        Boolean isPublic,          // 공개 여부
        LocalDateTime startedAt,   // 읽기 시작 시각
        LocalDateTime completedAt  // 완독 시각
) {

    public static ReadingRecordResponse from(ReadingRecord record) {
        return new ReadingRecordResponse(
                record.getId(),
                record.getBook().getId(),
                record.getRound(),
                record.getStatus(),
                record.getCurrentPage(),
                record.getTotalPages(),
                record.getProgressRate(),
                record.getGoalDate(),
                record.getGoalPage(),
                record.getMemo(),
                record.isPublic(),
                record.getStartedAt(),
                record.getCompletedAt()
        );
    }
}
