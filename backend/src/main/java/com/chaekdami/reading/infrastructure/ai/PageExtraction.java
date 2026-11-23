package com.chaekdami.reading.infrastructure.ai;

// AI가 사진에서 읽어 낸 결과
public record PageExtraction(
        String text,          // 사진 속 글자 (없으면 빈 문자열)
        Integer pageNumber,   // 페이지 번호 (못 찾으면 null)
        Boolean isBookPage,   // 책 페이지 사진인가 (판단 못 하면 null)
        boolean aiSkipped     // AI가 사진을 확인하지 않음 (사용 한도 초과 429). 임시 API라 통과로 판정함
) {

    // AI가 확인한 결과 (성공, 빈 결과, Mock)
    public PageExtraction(String text, Integer pageNumber, Boolean isBookPage) {
        this(text, pageNumber, isBookPage, false);
    }

    // AI 사용 한도 초과(429)로 확인하지 못함
    public static PageExtraction skipped() {
        return new PageExtraction("", null, null, true);
    }
}
