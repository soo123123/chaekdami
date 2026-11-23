package com.chaekdami.reading.presentation.dto.request;

import java.util.List;

// 독서 종료 후 저장 요청 (FE1 ReadingRecordRequest 형식 그대로)
public record CreateReadingSessionRequest(
        Long bookId,              // 서재 책 번호
        Integer readingTime,      // 독서 시간 (초), 3분 ~ 2시간
        Integer startPage,        // 이번에 읽기 시작한 페이지
        Integer endPage,          // 이번에 읽고 멈춘 페이지
        String sentence,          // 인상 깊은 문장 (선택). 이 세션의 회차 문장으로 저장, 쪽 번호 = endPage. 비어 있으면 저장 안 함, 500자 초과면 400
        List<Photo> photos,       // 인증 사진 — 아직 저장하지 않음 (업로드 방식 협의 후)
        Long photoVerificationId  // 통과한 독서 인증 번호 (선택). 내 PASSED 인증이고 아직 안 쓰였으면 이 세션에 연결
) {
    public record Photo(String uri) {}
}
