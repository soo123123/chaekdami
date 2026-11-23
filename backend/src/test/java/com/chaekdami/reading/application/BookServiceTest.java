package com.chaekdami.reading.application;

import com.chaekdami.reading.application.port.BookActivityCleaner;
import com.chaekdami.reading.domain.Book;
import com.chaekdami.reading.infrastructure.BookRepository;
import com.chaekdami.reading.infrastructure.CertificationRepository;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.reading.infrastructure.ReadingSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

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
    @Mock
    private BookActivityCleaner bookActivityCleaner;
    @InjectMocks
    private BookService service;

    private final Book book = new Book(USER_ID, null, "테스트 책", "저자", null, null, null, null, null, 300);

    @Test
    void 책을_지우면_독후활동_인증_세션_기록_책_순서로_지운다() {
        when(bookRepository.findByIdAndUserId(BOOK_ID, USER_ID)).thenReturn(Optional.of(book));

        service.deleteBook(USER_ID, BOOK_ID);

        InOrder order = inOrder(bookActivityCleaner, certificationRepository, readingSessionRepository,
                readingRecordRepository, bookRepository);
        order.verify(bookActivityCleaner).deleteAllOfBook(BOOK_ID);
        order.verify(certificationRepository).deleteAllByReadingRecordBookId(BOOK_ID);
        order.verify(readingSessionRepository).deleteAllByReadingRecordBookId(BOOK_ID);
        order.verify(readingRecordRepository).deleteAllByBookId(BOOK_ID);
        order.verify(bookRepository).delete(book);
    }

    @Test
    void 독후활동_정리가_실패하면_예외가_나가고_이후_삭제를_하지_않는다() {
        when(bookRepository.findByIdAndUserId(BOOK_ID, USER_ID)).thenReturn(Optional.of(book));
        doThrow(new IllegalStateException("정리 실패")).when(bookActivityCleaner).deleteAllOfBook(BOOK_ID);

        assertThatThrownBy(() -> service.deleteBook(USER_ID, BOOK_ID)).isInstanceOf(IllegalStateException.class);

        verify(certificationRepository, never()).deleteAllByReadingRecordBookId(anyLong());
        verify(bookRepository, never()).delete(any());
        // 실제 DB에서는 @Transactional로 이미 지운 독후활동도 롤백된다
    }

    @Test
    void 내_책이_아니면_404이고_아무것도_지우지_않는다() {
        when(bookRepository.findByIdAndUserId(BOOK_ID, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteBook(USER_ID, BOOK_ID)).isInstanceOf(ResponseStatusException.class);

        verify(bookActivityCleaner, never()).deleteAllOfBook(anyLong());
    }
}
