package com.chaekdami.reading.infrastructure.ai;

// AI가 사진에서 읽어 낸 결과
public record PageExtraction(
        String text,          // 사진 속 글자 (없으면 빈 문자열)
        Integer pageNumber,   // 페이지 번호 (못 찾으면 null)
        Boolean isBookPage    // 책 페이지 사진인가 (판단 못 하면 null)
) {}
