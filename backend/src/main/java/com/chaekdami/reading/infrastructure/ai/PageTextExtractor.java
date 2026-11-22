package com.chaekdami.reading.infrastructure.ai;

// 사진 → 글자·페이지 번호 추출 (AI 서비스가 정해지면 이 인터페이스의 구현체만 추가하면 됨)
public interface PageTextExtractor {

    PageExtraction extract(byte[] image, String contentType);
}
