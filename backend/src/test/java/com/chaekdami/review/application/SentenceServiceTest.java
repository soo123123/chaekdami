package com.chaekdami.review.application;

import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.command.SentenceCreateCommand;
import com.chaekdami.review.application.command.SentenceUpdateCommand;
import com.chaekdami.review.application.event.SentenceCreatedEvent;
import com.chaekdami.review.application.port.BookReader;
import com.chaekdami.review.application.port.ReadingRecordReader;
import com.chaekdami.review.application.result.SentenceResult;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.domain.Sentence;
import com.chaekdami.review.infrastructure.SentenceRepository;
import com.chaekdami.user.application.CurrentUser;
import com.chaekdami.user.application.exception.InvalidRequestException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;

import static com.chaekdami.review.ReviewFixtures.book;
import static com.chaekdami.review.ReviewFixtures.record;
import static com.chaekdami.review.ReviewFixtures.sentence;
import static com.chaekdami.review.ReviewFixtures.signIn;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SentenceServiceTest {

    // 2026-10-01 15:30 UTC는 한국 시각으로 10월 2일 00:30이다.
    private static final Clock LATE_UTC = Clock.fixed(Instant.parse("2026-10-01T15:30:00Z"), ZoneOffset.UTC);

    private final SentenceRepository sentenceRepository = mock(SentenceRepository.class);
    private final ReadingRecordReader readingRecordReader = mock(ReadingRecordReader.class);
    private final BookReader bookReader = mock(BookReader.class);
    private final ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);
    private SentenceService sentenceService;

    @BeforeEach
    void setUp() {
        sentenceService = new SentenceService(sentenceRepository,
                new OwnedResources(readingRecordReader, bookReader), bookReader, new CurrentUser(),
                new KoreanTime(LATE_UTC), eventPublisher);
        signIn(1L);
        when(bookReader.find(7L)).thenReturn(Optional.of(book(7L, 1L, "9791162540640", 400)));
        when(sentenceRepository.save(any())).thenAnswer(invocation -> {
            Sentence saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 12L);
            return saved;
        });
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @ParameterizedTest
    @ValueSource(strings = {"NOT_STARTED", "IN_PROGRESS", "COMPLETED"})
    void ownerCanWriteInEveryStatus(String status) {
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 1L, 7L, status)));

        SentenceResult result = sentenceService.create(3L, new SentenceCreateCommand("  습관은 복리다  ", 12));

        assertEquals("습관은 복리다", result.content());
        assertEquals(12, result.pageNumber());
        assertEquals(7L, result.bookId());
    }

    @Test
    void readDateIsTodayInKoreaEvenWhenServerClockIsUtc() {
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 1L, 7L, "IN_PROGRESS")));

        SentenceResult result = sentenceService.create(3L, new SentenceCreateCommand("문장", null));

        assertEquals(LocalDate.of(2026, 10, 2), result.readDate());
        ArgumentCaptor<SentenceCreatedEvent> event = ArgumentCaptor.forClass(SentenceCreatedEvent.class);
        verify(eventPublisher).publishEvent(event.capture());
        assertEquals(new SentenceCreatedEvent(1L, 3L, 12L, LocalDate.of(2026, 10, 2)), event.getValue());
    }

    @Test
    void anotherUsersRecordLooksMissing() {
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 2L, 7L, "IN_PROGRESS")));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> sentenceService.create(3L, new SentenceCreateCommand("문장", null)));

        assertEquals(ReviewErrorCode.READING_RECORD_NOT_FOUND, exception.getErrorCode());
        verify(sentenceRepository, never()).save(any());
    }

    @Test
    void rejectsBlankAndTooLongContent() {
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 1L, 7L, "IN_PROGRESS")));

        assertThrows(InvalidRequestException.class,
                () -> sentenceService.create(3L, new SentenceCreateCommand("   ", null)));
        assertThrows(InvalidRequestException.class,
                () -> sentenceService.create(3L, new SentenceCreateCommand("가".repeat(501), null)));
        sentenceService.create(3L, new SentenceCreateCommand("가".repeat(500), null));
    }

    @Test
    void pageNumberMustBeInsideTheBook() {
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 1L, 7L, "IN_PROGRESS")));

        InvalidRequestException zero = assertThrows(InvalidRequestException.class,
                () -> sentenceService.create(3L, new SentenceCreateCommand("문장", 0)));
        assertThrows(InvalidRequestException.class,
                () -> sentenceService.create(3L, new SentenceCreateCommand("문장", 401)));

        assertEquals("pageNumber", zero.getField());
        assertEquals(400, sentenceService.create(3L, new SentenceCreateCommand("문장", 400)).pageNumber());
    }

    @Test
    void updateKeepsOmittedFieldsAndCanClearPageNumber() {
        Sentence stored = sentence(12L, 1L, 3L, LocalDate.of(2026, 10, 1), 68, "원래 문장");
        when(sentenceRepository.findById(12L)).thenReturn(Optional.of(stored));

        sentenceService.update(12L, new SentenceUpdateCommand("고친 문장", false, null));
        assertEquals("고친 문장", stored.getContent());
        assertEquals(68, stored.getPageNumber());

        sentenceService.update(12L, new SentenceUpdateCommand(null, true, null));
        assertEquals("고친 문장", stored.getContent());
        assertNull(stored.getPageNumber());
    }

    @Test
    void anotherUsersSentenceLooksMissing() {
        when(sentenceRepository.findById(12L))
                .thenReturn(Optional.of(sentence(12L, 2L, 3L, LocalDate.of(2026, 10, 1), null, "남의 문장")));

        BusinessException exception = assertThrows(BusinessException.class, () -> sentenceService.delete(12L));

        assertEquals(ReviewErrorCode.SENTENCE_NOT_FOUND, exception.getErrorCode());
        verify(sentenceRepository, never()).delete(any());
    }
}
