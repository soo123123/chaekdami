package com.chaekdami.review.application;

import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.command.ReviewWriteCommand;
import com.chaekdami.review.application.event.ReviewCreatedEvent;
import com.chaekdami.review.application.port.BookView;
import com.chaekdami.review.application.port.ReadingRecordReader;
import com.chaekdami.review.application.result.ReviewResult;
import com.chaekdami.review.domain.Review;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.infrastructure.ReviewRepository;
import com.chaekdami.user.application.CurrentUser;
import com.chaekdami.user.application.exception.InvalidRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReadingRecordReader readingRecordReader;
    private final OwnedResources ownedResources;
    private final CurrentUser currentUser;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ReviewResult create(Long bookId, ReviewWriteCommand command) {
        Long userId = currentUser.requireId();
        BookView book = ownedResources.requireBook(bookId, userId);
        if (reviewRepository.findByBookId(bookId).isPresent()) {
            throw new BusinessException(ReviewErrorCode.REVIEW_ALREADY_EXISTS);
        }
        if (!readingRecordReader.hasCompletedRound(bookId)) {
            throw new BusinessException(ReviewErrorCode.READING_NOT_COMPLETED);
        }
        return ReviewResult.from(createFor(book, userId, command));
    }

    public ReviewResult getMine(Long bookId) {
        Long userId = currentUser.requireId();
        ownedResources.requireBook(bookId, userId);
        return reviewRepository.findByBookId(bookId)
                .map(ReviewResult::from)
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.REVIEW_NOT_FOUND));
    }

    @Transactional
    public ReviewResult update(Long reviewId, ReviewWriteCommand command) {
        Long userId = currentUser.requireId();
        Review review = reviewRepository.findById(reviewId)
                .filter(found -> found.ownedBy(userId))
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.REVIEW_NOT_FOUND));
        applyChanges(review, command, ownedResources.requireBook(review.getBookId(), userId));
        return ReviewResult.from(review);
    }

    /**
     * 완독 여부와 중복은 호출하는 쪽에서 확인한다.
     */
    Review createFor(BookView book, Long userId, ReviewWriteCommand command) {
        if (command.rating() == null) {
            throw new InvalidRequestException("rating", "별점을 입력해야 합니다.");
        }
        Review review = Review.builder()
                .userId(userId)
                .bookId(book.bookId())
                .isbn(book.isbn())
                .rating(validRating(command.rating()))
                .oneLine(command.oneLine() == null ? null : normalizeOneLine(command.oneLine()))
                .isSpoiler(Boolean.TRUE.equals(command.isSpoiler()))
                .isPublic(command.isPublic())
                .build();
        try {
            review = reviewRepository.saveAndFlush(review);
        } catch (DataIntegrityViolationException exception) {
            throw new BusinessException(ReviewErrorCode.REVIEW_ALREADY_EXISTS);
        }
        eventPublisher.publishEvent(new ReviewCreatedEvent(userId, book.bookId(), review.getId()));
        return review;
    }

    void applyChanges(Review review, ReviewWriteCommand command, BookView book) {
        if (command.rating() != null) {
            review.changeRating(validRating(command.rating()));
        }
        if (command.oneLine() != null) {
            review.changeOneLine(normalizeOneLine(command.oneLine()));
        }
        if (command.isSpoiler() != null) {
            review.changeSpoiler(command.isSpoiler());
        }
        if (command.isPublic() != null) {
            review.changeVisibility(command.isPublic());
        }
        review.syncIsbn(book.isbn());
        reviewRepository.flush();
    }

    private static int validRating(int rating) {
        if (rating < Review.MIN_RATING || rating > Review.MAX_RATING) {
            throw new InvalidRequestException("rating",
                    "별점은 " + Review.MIN_RATING + " 이상 " + Review.MAX_RATING + " 이하여야 합니다.");
        }
        return rating;
    }

    /**
     * 빈 문자열은 한줄평을 지운다는 뜻이라 null로 바꾼다.
     */
    private static String normalizeOneLine(String oneLine) {
        String trimmed = oneLine.strip();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.contains("\n") || trimmed.contains("\r")) {
            throw new InvalidRequestException("oneLine", "한줄평에는 줄바꿈을 넣을 수 없습니다.");
        }
        if (trimmed.length() > Review.MAX_ONE_LINE_LENGTH) {
            throw new InvalidRequestException("oneLine",
                    "한줄평은 " + Review.MAX_ONE_LINE_LENGTH + "자 이하여야 합니다.");
        }
        return trimmed;
    }
}
