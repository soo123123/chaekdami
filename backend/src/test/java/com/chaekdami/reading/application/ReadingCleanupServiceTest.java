package com.chaekdami.reading.application;

import com.chaekdami.reading.infrastructure.BookRepository;
import com.chaekdami.reading.infrastructure.CertificationRepository;
import com.chaekdami.reading.infrastructure.ReadingCleanupListener;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.reading.infrastructure.ReadingSessionRepository;
import com.chaekdami.user.application.event.UserWithdrawnEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.inOrder;

@ExtendWith(MockitoExtension.class)
class ReadingCleanupServiceTest {

    private static final Long USER_ID = 7L;

    @Mock
    private CertificationRepository certificationRepository;
    @Mock
    private ReadingSessionRepository readingSessionRepository;
    @Mock
    private ReadingRecordRepository readingRecordRepository;
    @Mock
    private BookRepository bookRepository;
    @InjectMocks
    private ReadingCleanupService service;

    @Test
    void 탈퇴한_사용자의_인증_세션_기록_책을_순서대로_지운다() {
        service.deleteAllOfUser(USER_ID);

        InOrder order = inOrder(certificationRepository, readingSessionRepository, readingRecordRepository, bookRepository);
        order.verify(certificationRepository).deleteAllByUserId(USER_ID);
        order.verify(readingSessionRepository).deleteAllByUserId(USER_ID);
        order.verify(readingRecordRepository).deleteAllByUserId(USER_ID);
        order.verify(bookRepository).deleteAllByUserId(USER_ID);
    }

    @Test
    void 탈퇴_이벤트를_받으면_그_사용자의_reading_데이터를_지운다() {
        new ReadingCleanupListener(service).onUserWithdrawn(new UserWithdrawnEvent(USER_ID));

        InOrder order = inOrder(certificationRepository, bookRepository);
        order.verify(certificationRepository).deleteAllByUserId(USER_ID);
        order.verify(bookRepository).deleteAllByUserId(USER_ID);
    }
}
