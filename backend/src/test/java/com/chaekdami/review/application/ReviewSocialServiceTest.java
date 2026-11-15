package com.chaekdami.review.application;

import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.command.ReviewReportCommand;
import com.chaekdami.review.application.port.UserNicknameReader;
import com.chaekdami.review.application.result.LikeResult;
import com.chaekdami.review.application.result.RatingSummary;
import com.chaekdami.review.domain.ReportReason;
import com.chaekdami.review.domain.Review;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.infrastructure.ReviewLikeRepository;
import com.chaekdami.review.infrastructure.ReviewReportRepository;
import com.chaekdami.review.infrastructure.ReviewRepository;
import com.chaekdami.user.application.CurrentUser;
import com.chaekdami.user.application.exception.InvalidRequestException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static com.chaekdami.review.ReviewFixtures.signIn;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReviewSocialServiceTest {

    private final ReviewRepository reviewRepository = mock(ReviewRepository.class);
    private final ReviewLikeRepository reviewLikeRepository = mock(ReviewLikeRepository.class);
    private final ReviewReportRepository reviewReportRepository = mock(ReviewReportRepository.class);
    private ReviewSocialService service;

    @BeforeEach
    void setUp() {
        service = new ReviewSocialService(reviewRepository, reviewLikeRepository, reviewReportRepository,
                mock(UserNicknameReader.class), new CurrentUser(), new KoreanTime());
        ReflectionTestUtils.setField(service, "blindThreshold", 3);
        signIn(1L);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void cannotLikeOwnReview() {
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(review(1L, "내 한줄평", true)));

        BusinessException exception = assertThrows(BusinessException.class, () -> service.like(5L));

        assertEquals(ReviewErrorCode.CANNOT_LIKE_OWN_REVIEW, exception.getErrorCode());
    }

    @Test
    void likeTwiceCountsOnce() {
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(review(2L, "남의 한줄평", true)));
        when(reviewLikeRepository.insertIfAbsent(eq(5L), eq(1L), any())).thenReturn(1, 0);
        when(reviewRepository.findLikeCount(5L)).thenReturn(1);

        service.like(5L);
        LikeResult second = service.like(5L);

        verify(reviewRepository).incrementLikeCount(5L);
        assertTrue(second.liked());
        assertEquals(1, second.likeCount());
    }

    @Test
    void hiddenReviewsCannotBeLikedOrReported() {
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(review(2L, "비공개", false)));
        when(reviewRepository.findById(6L)).thenReturn(Optional.of(review(2L, null, true)));

        assertEquals(ReviewErrorCode.REVIEW_NOT_FOUND,
                assertThrows(BusinessException.class, () -> service.like(5L)).getErrorCode());
        assertEquals(ReviewErrorCode.REVIEW_NOT_FOUND, assertThrows(BusinessException.class,
                () -> service.report(6L, new ReviewReportCommand(ReportReason.SPAM, null))).getErrorCode());
    }

    @Test
    void reportAddsToCountWithThreshold() {
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(review(2L, "스포일러 한줄평", true)));
        when(reviewReportRepository.insertIfAbsent(eq(5L), eq(1L), eq("SPOILER"), eq(null), any())).thenReturn(1);

        service.report(5L, new ReviewReportCommand(ReportReason.SPOILER, "  "));

        verify(reviewRepository).addReport(eq(5L), eq(3), any());
    }

    @Test
    void reportRules() {
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(review(2L, "한줄평", true)));
        when(reviewRepository.findById(7L)).thenReturn(Optional.of(review(1L, "내 한줄평", true)));
        when(reviewReportRepository.insertIfAbsent(any(), any(), any(), any(), any())).thenReturn(0);

        assertThrows(InvalidRequestException.class,
                () -> service.report(5L, new ReviewReportCommand(ReportReason.OTHER, " ")));
        assertEquals(ReviewErrorCode.CANNOT_REPORT_OWN_REVIEW, assertThrows(BusinessException.class,
                () -> service.report(7L, new ReviewReportCommand(ReportReason.SPAM, null))).getErrorCode());
        assertEquals(ReviewErrorCode.ALREADY_REPORTED, assertThrows(BusinessException.class,
                () -> service.report(5L, new ReviewReportCommand(ReportReason.SPAM, null))).getErrorCode());
        verify(reviewRepository, never()).addReport(anyLong(), anyInt(), any());
    }

    @Test
    void ratingSummaryFillsEveryStarAndRoundsTheAverage() {
        when(reviewRepository.countRatingsByIsbn("9791162540640")).thenReturn(List.of(
                ratingCount(5, 6), ratingCount(4, 4), ratingCount(3, 1), ratingCount(2, 1)));

        RatingSummary summary = service.ratingSummary("979-11-6254-064-0");

        assertEquals("9791162540640", summary.isbn());
        assertEquals(12, summary.ratingCount());
        assertEquals(4.3, summary.averageRating());
        assertEquals(List.of("1", "2", "3", "4", "5"), List.copyOf(summary.distribution().keySet()));
        assertEquals(0L, summary.distribution().get("1"));
        assertEquals(6L, summary.distribution().get("5"));
    }

    @Test
    void isbnFollowsTheLibraryNormalization() {
        assertEquals("9791162540640", ReviewSocialService.normalizeIsbn(" 979-11-6254-064-0 "));
        assertEquals("890123456X", ReviewSocialService.normalizeIsbn("89-0123-456-x"));
        assertThrows(InvalidRequestException.class, () -> ReviewSocialService.normalizeIsbn("--"));
    }

    private static Review review(Long userId, String oneLine, boolean isPublic) {
        Review review = Review.builder()
                .userId(userId).bookId(7L).isbn("9791162540640").rating(4).oneLine(oneLine).isPublic(isPublic)
                .build();
        ReflectionTestUtils.setField(review, "id", 5L);
        return review;
    }

    private static ReviewRepository.RatingCount ratingCount(int rating, long count) {
        return new ReviewRepository.RatingCount() {
            @Override
            public short getRating() {
                return (short) rating;
            }

            @Override
            public long getCount() {
                return count;
            }
        };
    }
}
