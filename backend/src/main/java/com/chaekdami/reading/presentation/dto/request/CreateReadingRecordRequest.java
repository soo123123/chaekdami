package com.chaekdami.reading.presentation.dto.request;

import java.time.LocalDate;

// 새 독서 기록(회차) 시작 요청 — 전부 선택값, 본문 없이 보내도 됨
public record CreateReadingRecordRequest(
        Integer currentPage,   // 이미 읽은 페이지 (없으면 0)
        LocalDate goalDate,    // 목표 완독 날짜 ("2026-11-30")
        Integer goalPage,      // 하루 목표 페이지
        String memo,           // 한마디 메모 (200자 이하)
        Boolean isPublic       // 공개 여부 (없으면 비공개)
) {}
