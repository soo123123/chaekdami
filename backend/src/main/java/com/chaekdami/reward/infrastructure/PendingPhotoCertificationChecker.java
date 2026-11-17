package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.application.port.PhotoCertificationChecker;
import org.springframework.stereotype.Component;

/**
 * BE1 의 사진 인증 조회(isPhotoCertified)가 생기기 전까지 쓰는 임시 구현. 항상 "인증 안 됨"으로 본다.
 * BE1 조회가 생기면 이 클래스를 그 메서드를 부르는 구현으로 바꾼다.
 */
@Component
public class PendingPhotoCertificationChecker implements PhotoCertificationChecker {

    @Override
    public boolean isPhotoCertified(Long userId, Long readingSessionId) {
        return false;
    }
}
