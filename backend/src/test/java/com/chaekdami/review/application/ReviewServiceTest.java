package com.chaekdami.review.application;

import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.command.ReviewWriteCommand;
import com.chaekdami.review.application.event.ReviewCreatedEvent;
import com.chaekdami.review.application.port.BookReader;
import com.chaekdami.review.application.port.ReadingRecordReader;
import com.chaekdami.review.application.result.ReviewResult;
import com.chaekdami.review.domain.Review;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.infrastructure.ReviewRepository;
import com.chaekdami.user.application.CurrentUser;
import com.chaekdami.user.application.exception.InvalidRequestException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static com.chaekdami.review.ReviewFixtures.book;
import static com.chaekdami.review.ReviewFixtures.signIn;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReviewServiceTest {

    private final ReviewRepository reviewRepository = mock(ReviewRepository.class);
    private final ReadingRecordReader readingRecordReader = mock(ReadingRecordReader.class);
    private final BookReader bookReader = mock(BookReader.class);
    private final ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);
    private ReviewService reviewService;

    @BeforeEach
    void setUp() {
        reviewService = new ReviewService(reviewRepository, readingRecordReader,
                new OwnedResources(readingRecordReader, bookReader), new CurrentUser(), eventPublisher);
        signIn(1L);
        when(bookReader.find(7L)).thenReturn(Optional.of(book(7L, 1L, "9791162540640", 400)));
        when(reviewRepository.findByBookId(7L)).thenReturn(Optional.empty());
        when(reviewRepository.saveAndFlush(any())).thenAnswer(invocation -> {
            Review saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 5L);
            return saved;
        });
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createNeedsACompletedRound() {
        when(readingRecordReader.hasCompletedRound(7L)).thenReturn(false);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> reviewService.create(7L, new ReviewWriteCommand(4, "좋아요", null, null)));

        assertEquals(ReviewErrorCode.READING_NOT_COMPLETED, exception.getErrorCode());
        verify(reviewRepository, never()).saveAndFlush(any());
    }

    @Test
    void createCopiesIsbnAndDefaultsToPublic() {
        when(readingRecordReader.hasCompletedRound(7L)).thenReturn(true);

        ReviewResult result = reviewService.create(7L, new ReviewWriteCommand(4, "  다시 읽고 싶은 책  ", null, null));

        assertEquals(4, result.rating());
        assertEquals("다시 읽고 싶은 책", result.oneLine());
        assertTrue(result.isPublic());
        assertFalse(result.isSpoiler());
        verify(eventPublisher).publishEvent(new ReviewCreatedEvent(1L, 7L, 5L));
    }

    @Test
    void secondCreateIsRejected() {
        when(reviewRepository.findByBookId(7L)).thenReturn(Optional.of(review(1L)));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> reviewService.create(7L, new ReviewWriteCommand(5, null, null, null)));

        assertEquals(ReviewErrorCode.REVIEW_ALREADY_EXISTS, exception.getErrorCode());
    }

    @Test
    void concurrentCreateBecomesConflict() {
        when(readingRecordReader.hasCompletedRound(7L)).thenReturn(true);
        doThrow(new DataIntegrityViolationException("uk_reviews_book_id")).when(reviewRepository).saveAndFlush(any());

        BusinessException exception = assertThrows(BusinessException.class,
                () -> reviewService.create(7L, new ReviewWriteCommand(5, null, null, null)));

        assertEquals(ReviewErrorCode.REVIEW_ALREADY_EXISTS, exception.getErrorCode());
    }

    @Test
    void ratingAndOneLineRules() {
        when(readingRecordReader.hasCompletedRound(7L)).thenReturn(true);

        assertThrows(InvalidRequestException.class,
                () -> reviewService.create(7L, new ReviewWriteCommand(null, "별점 없음", null, null)));
        assertThrows(InvalidRequestException.class,
                () -> reviewService.create(7L, new ReviewWriteCommand(6, null, null, null)));
        assertThrows(InvalidRequestException.class,
                () -> reviewService.create(7L, new ReviewWriteCommand(3, "가".repeat(101), null, null)));
        assertThrows(InvalidRequestException.class,
                () -> reviewService.create(7L, new ReviewWriteCommand(3, "첫 줄\n둘째 줄", null, null)));
        assertNull(reviewService.create(7L, new ReviewWriteCommand(3, "   ", null, null)).oneLine());
    }

    @Test
    void patchKeepsOmittedFieldsAndEmptyOneLineClearsIt() {
        Review stored = review(1L);
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(stored));

        reviewService.update(5L, new ReviewWriteCommand(null, null, true, null));
        assertEquals(4, stored.getRating());
        assertEquals("원래 한줄평", stored.getOneLine());
        assertTrue(stored.isSpoiler());

        reviewService.update(5L, new ReviewWriteCommand(2, "", null, false));
        assertEquals(2, stored.getRating());
        assertNull(stored.getOneLine());
        assertFalse(stored.isPublic());
    }

    @Test
    void anotherUsersReviewLooksMissing() {
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(review(2L)));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> reviewService.update(5L, new ReviewWriteCommand(1, null, null, null)));

        assertEquals(ReviewErrorCode.REVIEW_NOT_FOUND, exception.getErrorCode());
    }

    static Review review(Long userId) {
        Review review = Review.builder()
                .userId(userId).bookId(7L).isbn("9791162540640").rating(4).oneLine("원래 한줄평").build();
        ReflectionTestUtils.setField(review, "id", 5L);
        return review;
    }
}
