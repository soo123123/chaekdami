package com.chaekdami.reading.application;

import com.chaekdami.reading.domain.Book;
import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.domain.ReadingSession;
import com.chaekdami.reading.infrastructure.BookRepository;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
    @InjectMocks
    private ReadingSessionService service;

    private final Book book = new Book(USER_ID, null, "테스트 책", "저자", null, null, null, null, null, 300);

    @BeforeEach
    void setUp() {
        when(bookRepository.findByIdAndUserId(BOOK_ID, USER_ID)).thenReturn(Optional.of(book));
        when(readingRecordRepository.findFirstByBookIdOrderByRoundDesc(any())).thenReturn(Optional.empty());
        when(readingRecordRepository.save(any(ReadingRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void 독서_시간이_3분_미만이면_예외가_나고_세션을_저장하지_않는다() {
        CreateReadingSessionRequest request = new CreateReadingSessionRequest(BOOK_ID, 179, 0, 10, null, null);

        assertThatThrownBy(() -> service.create(USER_ID, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("독서 시간은 3분 이상이어야 합니다.");

        verify(readingSessionRepository, never()).save(any());
    }

    @Test
    void 독서_시간이_정확히_3분이면_저장한다() {
        when(readingSessionRepository.save(any(ReadingSession.class))).thenAnswer(invocation -> invocation.getArgument(0));
        CreateReadingSessionRequest request = new CreateReadingSessionRequest(BOOK_ID, 180, 0, 10, null, null);

        ReadingSessionResponse response = service.create(USER_ID, request);

        assertThat(response.readingTime()).isEqualTo(180);
        assertThat(response.endPage()).isEqualTo(10);
        verify(readingSessionRepository).save(any(ReadingSession.class));
    }
}
