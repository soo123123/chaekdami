package com.chaekdami.reward.application.port;

/**
 * 독서 세션의 사진 인증 여부를 독서 도메인(BE1)에 묻는 포트. 클라이언트가 보낸 인증 값은 믿지 않는다.
 * BE1 의 isPhotoCertified(userId, readingSessionId) 가 생기면 그 메서드를 부르는 구현으로 바꾼다.
 */
public interface PhotoCertificationChecker {

    /**
     * 세션이 요청자 본인 것이고 통과한 사진 검증이 연결돼 있으면 true
     */
    boolean isPhotoCertified(Long userId, Long readingSessionId);
}
