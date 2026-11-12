package com.chaekdami.reading.presentation.dto.request;

import java.util.List;

// 독서 종료 후 저장 요청 (FE1 ReadingRecordRequest 형식 그대로)
public record CreateReadingSessionRequest(
        Long bookId,              // 서재 책 번호
        Integer readingTime,      // 독서 시간 (초), 1초 ~ 2시간
        Integer startPage,        // 이번에 읽기 시작한 페이지
        Integer endPage,          // 이번에 읽고 멈춘 페이지
        String sentence,          // 인상 깊은 문장 — 아직 저장하지 않음 (BE 3 문장 모음과 연동 방식 협의 후)
        List<Photo> photos        // 인증 사진 — 아직 저장하지 않음 (업로드 방식 협의 후)
) {
    public record Photo(String uri) {}
}
