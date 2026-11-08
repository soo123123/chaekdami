package com.chaekdami.review.application;

import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.command.BookReportCommand;
import com.chaekdami.review.application.command.ReadingReviewCommand;
import com.chaekdami.review.application.command.ReviewWriteCommand;
import com.chaekdami.review.application.event.BookReportCreatedEvent;
import com.chaekdami.review.application.event.BookReportDeletedEvent;
import com.chaekdami.review.application.event.BookReportUpdatedEvent;
import com.chaekdami.review.application.port.BookReader;
import com.chaekdami.review.application.port.ReadingRecordReader;
import com.chaekdami.review.application.result.ReadingReviewResult;
import com.chaekdami.review.domain.BookReport;
import com.chaekdami.review.domain.Review;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.infrastructure.BookReportRepository;
import com.chaekdami.review.infrastructure.ReviewRepository;
import com.chaekdami.user.application.CurrentUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static com.chaekdami.review.ReviewFixtures.book;
import static com.chaekdami.review.ReviewFixtures.record;
import static com.chaekdami.review.ReviewFixtures.signIn;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReadingReviewServiceTest {

    private final ReviewRepository reviewRepository = mock(ReviewRepository.class);
    private final BookReportRepository bookReportRepository = mock(BookReportRepository.class);
    private final ReadingRecordReader readingRecordReader = mock(ReadingRecordReader.class);
    private final BookReader bookReader = mock(BookReader.class);
    private final ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);
    private final AtomicReference<Review> storedReview = new AtomicReference<>();
    private final AtomicReference<BookReport> storedReport = new AtomicReference<>();
    private ReadingReviewService service;

    @BeforeEach
    void setUp() {
        OwnedResources ownedResources = new OwnedResources(readingRecordReader, bookReader);
        CurrentUser currentUser = new CurrentUser();
        ReviewService reviewService = new ReviewService(reviewRepository, readingRecordReader, ownedResources,
                currentUser, eventPublisher);
        BookReportService bookReportService = new BookReportService(bookReportRepository, currentUser, eventPublisher);
        service = new ReadingReviewService(reviewRepository, reviewService, bookReportService, ownedResources,
                currentUser);
        signIn(1L);

        when(bookReader.find(7L)).thenReturn(Optional.of(book(7L, 1L, "9791162540640", 400)));
        when(reviewRepository.findByBookId(7L)).thenAnswer(invocation -> Optional.ofNullable(storedReview.get()));
        when(reviewRepository.saveAndFlush(any())).thenAnswer(invocation -> {
            Review review = invocation.getArgument(0);
            ReflectionTestUtils.setField(review, "id", 5L);
            storedReview.set(review);
            return review;
        });
        when(bookReportRepository.findByReadingRecordId(3L))
                .thenAnswer(invocation -> Optional.ofNullable(storedReport.get()));
        when(bookReportRepository.saveAndFlush(any())).thenAnswer(invocation -> {
            BookReport report = invocation.getArgument(0);
            ReflectionTestUtils.setField(report, "id", 9L);
            storedReport.set(report);
            return report;
        });
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getReturnsNullSidesInsteadOfNotFound() {
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 1L, 7L, "IN_PROGRESS")));

        ReadingReviewResult result = service.get(3L);

        assertNull(result.review());
        assertNull(result.bookReport());
        assertFalse(result.canWrite());
    }

    @Test
    void putNeedsTheRoundToBeCompleted() {
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 1L, 7L, "IN_PROGRESS")));

        BusinessException exception = assertThrows(BusinessException.class, () -> service.put(3L,
                new ReadingReviewCommand(new ReviewWriteCommand(4, null, null, null), true,
                        new BookReportCommand("독후감", false))));

        assertEquals(ReviewErrorCode.READING_NOT_COMPLETED, exception.getErrorCode());
    }

    @Test
    void firstPutCreatesRatingAndBookReport() {
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 1L, 7L, "COMPLETED")));

        ReadingReviewResult result = service.put(3L, new ReadingReviewCommand(
                new ReviewWriteCommand(4, null, null, null), true, new BookReportCommand("  책을 읽으면서  ", null)));

        assertEquals(4, result.review().rating());
        assertEquals("책을 읽으면서", result.bookReport().content());
        assertFalse(result.bookReport().isPublic());
        assertEquals(1, result.bookReport().revision());
        verify(eventPublisher).publishEvent(new BookReportCreatedEvent(1L, 3L, 9L, 1));
    }

    @Test
    void secondRoundUpdatesTheBookReviewAndKeepsTheOneLine() {
        Review existing = Review.builder()
                .userId(1L).bookId(7L).isbn("9791162540640").rating(3).oneLine("커뮤니티에서 쓴 한줄평").build();
        ReflectionTestUtils.setField(existing, "id", 5L);
        storedReview.set(existing);
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 1L, 7L, "COMPLETED")));

        ReadingReviewResult result = service.put(3L, new ReadingReviewCommand(
                new ReviewWriteCommand(5, null, null, null), true, new BookReportCommand("두 번째 감상", true)));

        assertEquals(5, result.review().rating());
        assertEquals("커뮤니티에서 쓴 한줄평", result.review().oneLine());
        assertTrue(result.bookReport().isPublic());
        verify(reviewRepository, never()).saveAndFlush(any());
    }

    @Test
    void omittedBookReportIsKeptAndNullDeletesIt() {
        BookReport report = BookReport.builder()
                .userId(1L).readingRecordId(3L).bookId(7L).content("원래 독후감").isPublic(false).build();
        ReflectionTestUtils.setField(report, "id", 9L);
        storedReport.set(report);
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 1L, 7L, "COMPLETED")));

        service.put(3L, new ReadingReviewCommand(new ReviewWriteCommand(4, null, null, null), false, null));
        verify(bookReportRepository, never()).delete(any());

        service.put(3L, new ReadingReviewCommand(null, true, null));
        verify(bookReportRepository).delete(report);
        verify(eventPublisher).publishEvent(new BookReportDeletedEvent(1L, 3L, 9L));
    }

    @Test
    void visibilityOnlyPutKeepsTheContentAndEmptyContentDeletes() {
        BookReport report = BookReport.builder()
                .userId(1L).readingRecordId(3L).bookId(7L).content("원래 독후감").isPublic(false).build();
        ReflectionTestUtils.setField(report, "id", 9L);
        storedReport.set(report);
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 1L, 7L, "COMPLETED")));

        ReadingReviewResult result = service.put(3L,
                new ReadingReviewCommand(null, true, new BookReportCommand(null, true)));

        assertEquals("원래 독후감", result.bookReport().content());
        assertTrue(result.bookReport().isPublic());
        assertEquals(1, report.getRevision());
        verify(bookReportRepository, never()).delete(any());

        service.put(3L, new ReadingReviewCommand(null, true, new BookReportCommand("  ", null)));
        verify(bookReportRepository).delete(report);
    }

    @Test
    void revisionGrowsOnlyWhenContentChanges() {
        BookReport report = BookReport.builder()
                .userId(1L).readingRecordId(3L).bookId(7L).content("같은 본문").isPublic(false).build();
        ReflectionTestUtils.setField(report, "id", 9L);
        storedReport.set(report);
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 1L, 7L, "COMPLETED")));

        service.put(3L, new ReadingReviewCommand(null, true, new BookReportCommand("같은 본문", true)));
        assertEquals(1, report.getRevision());
        assertTrue(report.isPublic());

        service.put(3L, new ReadingReviewCommand(null, true, new BookReportCommand("바뀐 본문", null)));
        assertEquals(2, report.getRevision());
        verify(eventPublisher).publishEvent(new BookReportUpdatedEvent(1L, 3L, 9L, 2));
    }

    @Test
    void anotherUsersRoundLooksMissing() {
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 2L, 7L, "COMPLETED")));

        BusinessException exception = assertThrows(BusinessException.class, () -> service.get(3L));

        assertEquals(ReviewErrorCode.READING_RECORD_NOT_FOUND, exception.getErrorCode());
    }
}
