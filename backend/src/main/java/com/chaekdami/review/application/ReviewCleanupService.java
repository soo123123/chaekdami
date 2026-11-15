package com.chaekdami.review.application;

import com.chaekdami.review.infrastructure.BookReportRepository;
import com.chaekdami.review.infrastructure.ReviewLikeRepository;
import com.chaekdami.review.infrastructure.ReviewReportRepository;
import com.chaekdami.review.infrastructure.ReviewRepository;
import com.chaekdami.review.infrastructure.SentenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * review 테이블은 다른 도메인 ID에 DB FK가 없어서, 사용자나 책이 지워질 때 여기서 함께 지운다.
 * 호출한 쪽의 트랜잭션에 참여해 원본 삭제와 함께 커밋되거나 롤백된다.
 */
@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class ReviewCleanupService {

    private final ReviewRepository reviewRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final ReviewReportRepository reviewReportRepository;
    private final BookReportRepository bookReportRepository;
    private final SentenceRepository sentenceRepository;

    public void deleteAllOfUser(Long userId) {
        reviewRepository.decrementLikesGivenBy(userId);
        reviewLikeRepository.deleteAllByUserId(userId);
        reviewReportRepository.deleteAllByUserId(userId);
        reviewLikeRepository.deleteAllOnReviewsOf(userId);
        reviewReportRepository.deleteAllOnReviewsOf(userId);
        reviewRepository.deleteAllByUserId(userId);
        bookReportRepository.deleteAllByUserId(userId);
        sentenceRepository.deleteAllByUserId(userId);
    }

    /**
     * BE1 {@code BookService.deleteBook}이 책을 지우기 전에 같은 트랜잭션에서 호출한다.
     */
    public void deleteAllOfBook(Long bookId) {
        reviewLikeRepository.deleteAllOnBook(bookId);
        reviewReportRepository.deleteAllOnBook(bookId);
        reviewRepository.deleteAllByBookId(bookId);
        bookReportRepository.deleteAllByBookId(bookId);
        sentenceRepository.deleteAllByBookId(bookId);
    }
}
