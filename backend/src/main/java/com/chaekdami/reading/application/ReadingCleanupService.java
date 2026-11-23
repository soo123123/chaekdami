package com.chaekdami.reading.application;

import com.chaekdami.reading.infrastructure.BookRepository;
import com.chaekdami.reading.infrastructure.CertificationRepository;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.reading.infrastructure.ReadingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원 탈퇴 때 그 사용자의 reading 데이터(서재·독서 기록·세션·인증)를 지운다. (스펙 003 R4)
 * 탈퇴({@code UserService.withdraw})와 같은 트랜잭션에서만 실행한다. 실패하면 탈퇴 전체가 취소된다.
 * 문장·리뷰·독후감은 review 쪽 탈퇴 정리(ReviewCleanupService)가 지운다.
 */
@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class ReadingCleanupService {

    private final CertificationRepository certificationRepository;
    private final ReadingSessionRepository readingSessionRepository;
    private final ReadingRecordRepository readingRecordRepository;
    private final BookRepository bookRepository;

    // 참조하는 쪽부터: 인증 → 세션 → 독서 기록 → 책
    public void deleteAllOfUser(Long userId) {
        certificationRepository.deleteAllByUserId(userId);
        readingSessionRepository.deleteAllByUserId(userId);
        readingRecordRepository.deleteAllByUserId(userId);
        bookRepository.deleteAllByUserId(userId);
    }
}
