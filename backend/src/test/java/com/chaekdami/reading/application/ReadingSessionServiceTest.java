package com.chaekdami.reading.application;

import com.chaekdami.reading.domain.Book;
import com.chaekdami.reading.domain.Certification;
import com.chaekdami.reading.domain.CertificationStatus;
import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.domain.ReadingSession;
import com.chaekdami.reading.infrastructure.BookRepository;
import com.chaekdami.reading.infrastructure.CertificationRepository;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.reading.infrastructure.ReadingSessionRepository;
import com.chaekdami.reading.presentation.dto.request.CreateReadingSessionRequest;
import com.chaekdami.reading.presentation.dto.response.ReadingSessionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReadingSessionServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long BOOK_ID = 10L;

    @Mock
    private BookRepository bookRepository;
    @Mock
    private ReadingRecordRepository readingRecordRepository;
    @Mock
    private ReadingSessionRepository readingSessionRepository;
    @Mock
    private CertificationRepository certificationRepository;
    @InjectMocks
    private ReadingSessionService service;

    private final Book book = new Book(USER_ID, null, "테스트 책", "저자", null, null, null, null, null, 300);

    @BeforeEach
    void setUp() {
        when(bookRepository.findByIdAndUserId(BOOK_ID, USER_ID)).thenReturn(Optional.of(book));
        when(readingRecordRepository.findFirstByBookIdOrderByRoundDesc(any())).thenReturn(Optional.empty());
        // 회차가 이미 있는 테스트(다회독)에서는 쓰이지 않으므로 lenient
        lenient().when(readingRecordRepository.save(any(ReadingRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void 독서_시간이_3분_미만이면_예외가_나고_세션을_저장하지_않는다() {
        CreateReadingSessionRequest request = new CreateReadingSessionRequest(BOOK_ID, 179, 0, 10, null, null, null);

        assertThatThrownBy(() -> service.create(USER_ID, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("독서 시간은 3분 이상이어야 합니다.");

        verify(readingSessionRepository, never()).save(any());
    }

    @Test
    void 독서_시간이_정확히_3분이면_저장한다() {
        when(readingSessionRepository.save(any(ReadingSession.class))).thenAnswer(invocation -> invocation.getArgument(0));
        CreateReadingSessionRequest request = new CreateReadingSessionRequest(BOOK_ID, 180, 0, 10, null, null, null);

        ReadingSessionResponse response = service.create(USER_ID, request);

        assertThat(response.readingTime()).isEqualTo(180);
        assertThat(response.endPage()).isEqualTo(10);
        verify(readingSessionRepository).save(any(ReadingSession.class));
    }

    // ---- 사진 인증을 세션에 연결 (스펙 004 R5) ----

    private static final Long CERT_ID = 100L;
    private static final Long SESSION_ID = 500L;

    private void sessionSaveAssignsId() {
        when(readingSessionRepository.save(any(ReadingSession.class))).thenAnswer(invocation -> {
            ReadingSession s = invocation.getArgument(0);
            ReflectionTestUtils.setField(s, "id", SESSION_ID);
            return s;
        });
    }

    private Certification certification(ReadingRecord record, CertificationStatus status) {
        return Certification.of(record, "글자", "글자", null, true, status, "", false);
    }

    private CreateReadingSessionRequest requestWith(Long photoVerificationId) {
        return new CreateReadingSessionRequest(BOOK_ID, 600, 0, 10, null, null, photoVerificationId);
    }

    @Test
    void 통과한_내_인증이면_세션에_연결한다() {
        sessionSaveAssignsId();
        Certification cert = certification(ReadingRecord.start(book, 1), CertificationStatus.PASSED);
        when(certificationRepository.findByIdAndUserId(CERT_ID, USER_ID)).thenReturn(Optional.of(cert));

        service.create(USER_ID, requestWith(CERT_ID));

        assertThat(cert.getReadingSessionId()).isEqualTo(SESSION_ID);
    }

    @Test
    void 다회독_첫_세션처럼_인증의_회차가_달라도_연결한다() {
        sessionSaveAssignsId();
        ReadingRecord completedRound = ReadingRecord.start(book, 1);
        ReadingRecord newRound = ReadingRecord.start(book, 2);
        when(readingRecordRepository.findFirstByBookIdOrderByRoundDesc(any())).thenReturn(Optional.of(newRound));
        Certification cert = certification(completedRound, CertificationStatus.PASSED);
        when(certificationRepository.findByIdAndUserId(CERT_ID, USER_ID)).thenReturn(Optional.of(cert));

        service.create(USER_ID, requestWith(CERT_ID));

        assertThat(cert.getReadingSessionId()).isEqualTo(SESSION_ID);
        assertThat(cert.getReadingRecord()).isSameAs(completedRound);   // 회차는 옮기지 않음
    }

    @Test
    void 남의_인증이나_없는_번호면_연결하지_않고_저장은_성공한다() {
        sessionSaveAssignsId();
        when(certificationRepository.findByIdAndUserId(CERT_ID, USER_ID)).thenReturn(Optional.empty());

        ReadingSessionResponse response = service.create(USER_ID, requestWith(CERT_ID));

        assertThat(response.readingTime()).isEqualTo(600);
        verify(readingSessionRepository).save(any(ReadingSession.class));
    }

    @Test
    void 통과하지_못한_인증이면_연결하지_않는다() {
        sessionSaveAssignsId();
        Certification cert = certification(ReadingRecord.start(book, 1), CertificationStatus.UNVERIFIED);
        when(certificationRepository.findByIdAndUserId(CERT_ID, USER_ID)).thenReturn(Optional.of(cert));

        service.create(USER_ID, requestWith(CERT_ID));

        assertThat(cert.getReadingSessionId()).isNull();
    }

    @Test
    void 이미_다른_세션에_쓰인_인증이면_연결을_바꾸지_않는다() {
        sessionSaveAssignsId();
        Certification cert = certification(ReadingRecord.start(book, 1), CertificationStatus.PASSED);
        cert.linkSession(400L);
        when(certificationRepository.findByIdAndUserId(CERT_ID, USER_ID)).thenReturn(Optional.of(cert));

        service.create(USER_ID, requestWith(CERT_ID));

        assertThat(cert.getReadingSessionId()).isEqualTo(400L);
    }

    @Test
    void 인증_번호가_없으면_인증을_찾지_않는다() {
        sessionSaveAssignsId();

        service.create(USER_ID, requestWith(null));

        verify(certificationRepository, never()).findByIdAndUserId(anyLong(), anyLong());
    }
}
