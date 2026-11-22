package com.chaekdami.reward.infrastructure;

import com.chaekdami.reading.application.CertificationService;
import com.chaekdami.reward.application.port.PhotoCertificationChecker;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * BE1 독서 인증으로 세션의 사진 인증 여부를 확인한다.
 * 세션 저장 때 연결된 내 인증이 PASSED 이고 AI가 실제로 확인한 것(429로 확인 없이 통과한 것 제외)이면 true. (스펙 004 R5.3)
 */
@Component
@RequiredArgsConstructor
public class CertificationPhotoChecker implements PhotoCertificationChecker {

    private final CertificationService certificationService;

    @Override
    public boolean isPhotoCertified(Long userId, Long readingSessionId) {
        return certificationService.isPhotoCertified(userId, readingSessionId);
    }
}
