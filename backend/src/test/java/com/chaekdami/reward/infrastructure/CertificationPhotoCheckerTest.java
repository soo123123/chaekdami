package com.chaekdami.reward.infrastructure;

import com.chaekdami.reading.application.CertificationService;
import com.chaekdami.reading.application.CertificationVerifier;
import com.chaekdami.reading.domain.Book;
import com.chaekdami.reading.domain.Certification;
import com.chaekdami.reading.domain.CertificationStatus;
import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.infrastructure.CertificationRepository;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.reading.infrastructure.ai.PageTextExtractor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * 보상 포트 구현 → 실제 CertificationService 판단까지 확인한다. 리포지토리만 mock.
 */
@ExtendWith(MockitoExtension.class)
class CertificationPhotoCheckerTest {

    private static final Long USER_ID = 1L;
    private static final Long SESSION_ID = 500L;

    @Mock
    private ReadingRecordRepository readingRecordRepository;
    @Mock
    private CertificationRepository certificationRepository;
    @Mock
    private PageTextExtractor pageTextExtractor;

    private CertificationPhotoChecker checker;

    private final ReadingRecord record = ReadingRecord.start(
            new Book(USER_ID, null, "테스트 책", "저자", null, null, null, null, null, 300), 1);

    @BeforeEach
    void setUp() {
        CertificationService service = new CertificationService(
                readingRecordRepository, certificationRepository, pageTextExtractor, new CertificationVerifier(),
                org.springframework.transaction.support.TransactionOperations.withoutTransaction());
        checker = new CertificationPhotoChecker(service);
    }

    private Certification linked(CertificationStatus status, boolean aiSkipped) {
        Certification c = Certification.of(record, "글자", "글자", null, true, status, "", aiSkipped);
        return c;
    }

    @Test
    void AI가_확인하고_통과한_인증이_연결돼_있으면_사진_인증됨() {
        when(certificationRepository.findByUserIdAndReadingSessionId(USER_ID, SESSION_ID))
                .thenReturn(Optional.of(linked(CertificationStatus.PASSED, false)));

        assertThat(checker.isPhotoCertified(USER_ID, SESSION_ID)).isTrue();
    }

    @Test
    void 사용_한도_초과로_AI_확인_없이_통과한_인증은_보상_제외() {
        when(certificationRepository.findByUserIdAndReadingSessionId(USER_ID, SESSION_ID))
                .thenReturn(Optional.of(linked(CertificationStatus.PASSED, true)));

        assertThat(checker.isPhotoCertified(USER_ID, SESSION_ID)).isFalse();
    }

    @Test
    void 연결된_인증이_없으면_사진_인증_안_됨() {
        when(certificationRepository.findByUserIdAndReadingSessionId(USER_ID, SESSION_ID)).thenReturn(Optional.empty());

        assertThat(checker.isPhotoCertified(USER_ID, SESSION_ID)).isFalse();
    }

    @Test
    void 통과하지_못한_인증이면_사진_인증_안_됨() {
        when(certificationRepository.findByUserIdAndReadingSessionId(USER_ID, SESSION_ID))
                .thenReturn(Optional.of(linked(CertificationStatus.UNVERIFIED, false)));

        assertThat(checker.isPhotoCertified(USER_ID, SESSION_ID)).isFalse();
    }

    @Test
    void 세션_번호가_없으면_조회하지_않고_false() {
        assertThat(checker.isPhotoCertified(USER_ID, null)).isFalse();
    }
}
