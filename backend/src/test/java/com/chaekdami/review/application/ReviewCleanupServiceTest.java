package com.chaekdami.review.application;

import com.chaekdami.review.infrastructure.BookReportRepository;
import com.chaekdami.review.infrastructure.ReviewLikeRepository;
import com.chaekdami.review.infrastructure.ReviewReportRepository;
import com.chaekdami.review.infrastructure.ReviewRepository;
import com.chaekdami.review.infrastructure.SentenceRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;

class ReviewCleanupServiceTest {

    private final ReviewRepository reviewRepository = mock(ReviewRepository.class);
    private final ReviewLikeRepository reviewLikeRepository = mock(ReviewLikeRepository.class);
    private final ReviewReportRepository reviewReportRepository = mock(ReviewReportRepository.class);
    private final BookReportRepository bookReportRepository = mock(BookReportRepository.class);
    private final SentenceRepository sentenceRepository = mock(SentenceRepository.class);
    private final ReviewCleanupService service = new ReviewCleanupService(reviewRepository, reviewLikeRepository,
            reviewReportRepository, bookReportRepository, sentenceRepository);

    @Test
    void withdrawalCorrectsLikeCountsBeforeDeletingLikes() {
        service.deleteAllOfUser(1L);

        InOrder order = inOrder(reviewRepository, reviewLikeRepository, reviewReportRepository,
                bookReportRepository, sentenceRepository);
        order.verify(reviewRepository).decrementLikesGivenBy(1L);
        order.verify(reviewLikeRepository).deleteAllByUserId(1L);
        order.verify(reviewReportRepository).deleteAllByUserId(1L);
        order.verify(reviewLikeRepository).deleteAllOnReviewsOf(1L);
        order.verify(reviewReportRepository).deleteAllOnReviewsOf(1L);
        order.verify(reviewRepository).deleteAllByUserId(1L);
        order.verify(bookReportRepository).deleteAllByUserId(1L);
        order.verify(sentenceRepository).deleteAllByUserId(1L);
    }

    @Test
    void bookDeletionRemovesEveryActivityOfThatBook() {
        service.deleteAllOfBook(7L);

        InOrder order = inOrder(reviewRepository, reviewLikeRepository, reviewReportRepository,
                bookReportRepository, sentenceRepository);
        order.verify(reviewLikeRepository).deleteAllOnBook(7L);
        order.verify(reviewReportRepository).deleteAllOnBook(7L);
        order.verify(reviewRepository).deleteAllByBookId(7L);
        order.verify(bookReportRepository).deleteAllByBookId(7L);
        order.verify(sentenceRepository).deleteAllByBookId(7L);
    }
}
