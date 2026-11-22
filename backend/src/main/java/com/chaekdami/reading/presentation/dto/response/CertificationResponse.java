package com.chaekdami.reading.presentation.dto.response;

import com.chaekdami.reading.domain.Certification;
import com.chaekdami.reading.domain.CertificationStatus;

import java.time.LocalDateTime;
import java.util.List;

// 독서 인증 결과
public record CertificationResponse(
        Long id,                       // 인증 번호
        Long readingRecordId,          // 회차 기록 번호
        CertificationStatus status,    // PASSED / UNVERIFIED / FAILED
        Boolean bookPage,              // AI 판단: 책 페이지인가
        Integer detectedPage,          // 사진에서 찾은 페이지 번호 (못 찾으면 null)
        Boolean sentenceFound,         // 입력한 문장을 찾았는가 (문장을 안 보냈거나 목록 조회면 null)
        List<String> messages,         // 판정 이유·안내 문구 (화면에 그대로 보여줘도 됨)
        String extractedText,          // AI가 읽은 글자
        LocalDateTime createdAt
) {

    public static CertificationResponse from(Certification c, Boolean sentenceFound) {
        List<String> messages = (c.getMessage() == null || c.getMessage().isBlank())
                ? List.of()
                : List.of(c.getMessage().split("\n"));
        return new CertificationResponse(
                c.getId(),
                c.getReadingRecord().getId(),
                c.getStatus(),
                c.getBookPage(),
                c.getDetectedPage(),
                sentenceFound,
                messages,
                c.getExtractedText(),
                c.getCreatedAt()
        );
    }
}
