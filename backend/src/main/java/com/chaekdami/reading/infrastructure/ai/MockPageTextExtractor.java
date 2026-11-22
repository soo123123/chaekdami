package com.chaekdami.reading.infrastructure.ai;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

// 실제 AI 연결 전까지 쓰는 가짜 추출기 (reading.ocr.provider=mock 이거나 설정이 없을 때)
// - 항상 "책 페이지"로 판단, 페이지 번호는 못 찾은 것으로 처리
// - 글자는 사진 내용으로 만든 해시를 넣어서, 같은 사진을 두 번 올리면 재사용으로 걸리게 함
@Component
@ConditionalOnProperty(name = "reading.ocr.provider", havingValue = "mock", matchIfMissing = true)
public class MockPageTextExtractor implements PageTextExtractor {

    @Override
    public PageExtraction extract(byte[] image, String contentType) {
        String text = "모의 추출 텍스트입니다. 실제 AI 연결 전 테스트용 문장입니다. " + sha256(image);
        return new PageExtraction(text, null, true);
    }

    private String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
