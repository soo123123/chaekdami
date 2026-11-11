package com.chaekdami.reading.presentation.dto.request;

import java.time.LocalDate;

// 독서 기록 수정 요청 — 보낸 필드만 바뀜 (null이면 그대로)
public record UpdateReadingRecordRequest(
        Integer currentPage,   // 현재 페이지 (마지막 쪽이면 자동 완독)
        LocalDate goalDate,    // 목표 완독 날짜
        Integer goalPage,      // 하루 목표 페이지
        String memo,           // 한마디 메모
        Boolean isPublic       // 공개 여부
) {}
