package com.chaekdami.reading.domain;

// 독서 인증 결과
public enum CertificationStatus {
    PASSED,       // 통과
    UNVERIFIED,   // 확인 불가 (글자가 적거나 페이지 번호가 범위 밖) — 기록은 남기고 판단은 보류
    FAILED        // 실패 (책 페이지가 아니거나 같은 사진 재사용)
}
