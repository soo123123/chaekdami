package com.chaekdami.reading.presentation;

import com.chaekdami.reading.application.ReadingSessionService;
import com.chaekdami.reading.domain.Book;
import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.infrastructure.BookRepository;
import com.chaekdami.reading.infrastructure.CertificationRepository;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.reading.infrastructure.ReadingSessionRepository;
import com.chaekdami.user.presentation.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 실제 ReadingSessionService 와 도메인 검증을 거쳐 저장 API 가 3분 미만 요청을 400 으로 거절하는지 확인한다.
 * 리포지토리만 mock 이라 DB 없이 돈다.
 */
@ExtendWith(MockitoExtension.class)
class ReadingSessionControllerTest {

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

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ReadingSessionService service =
                new ReadingSessionService(bookRepository, readingRecordRepository, readingSessionRepository, certificationRepository);
        mockMvc = MockMvcBuilders.standaloneSetup(new ReadingSessionController(service))
                .setControllerAdvice(new ReadingExceptionHandler(), new GlobalExceptionHandler())
                .build();
        Book book = new Book(USER_ID, null, "테스트 책", "저자", null, null, null, null, null, 300);
        when(bookRepository.findByIdAndUserId(BOOK_ID, USER_ID)).thenReturn(Optional.of(book));
        when(readingRecordRepository.findFirstByBookIdOrderByRoundDesc(any())).thenReturn(Optional.empty());
        when(readingRecordRepository.save(any(ReadingRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void 독서_시간이_3분_미만이면_400과_에러_메시지를_돌려주고_저장하지_않는다() throws Exception {
        mockMvc.perform(post("/api/reading-sessions")
                        .header("X-User-Id", USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"bookId": 10, "readingTime": 179, "startPage": 0, "endPage": 10}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value("독서 시간은 3분 이상이어야 합니다."));

        verify(readingSessionRepository, never()).save(any());
    }
}
