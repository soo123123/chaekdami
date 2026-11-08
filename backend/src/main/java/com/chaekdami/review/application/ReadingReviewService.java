package com.chaekdami.review.application;

import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.command.ReadingReviewCommand;
import com.chaekdami.review.application.port.BookView;
import com.chaekdami.review.application.port.ReadingRecordView;
import com.chaekdami.review.application.result.BookReportResult;
import com.chaekdami.review.application.result.ReadingReviewResult;
import com.chaekdami.review.application.result.ReviewResult;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.infrastructure.ReviewRepository;
import com.chaekdami.user.application.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FE2 독후감 화면용. 리뷰는 책 기준, 독후감은 회차 기준이라 응답을 둘로 나눈다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReadingReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewService reviewService;
    private final BookReportService bookReportService;
    private final OwnedResources ownedResources;
    private final CurrentUser currentUser;

    /**
     * 리뷰나 독후감이 없어도 200이다. 없는 쪽은 null이다.
     */
    public ReadingReviewResult get(Long readingRecordId) {
        Long userId = currentUser.requireId();
        ReadingRecordView record = ownedResources.requireRecord(readingRecordId, userId);
        return load(record);
    }

    @Transactional
    public ReadingReviewResult put(Long readingRecordId, ReadingReviewCommand command) {
        Long userId = currentUser.requireId();
        ReadingRecordView record = ownedResources.requireRecord(readingRecordId, userId);
        if (!record.completed()) {
            throw new BusinessException(ReviewErrorCode.READING_NOT_COMPLETED);
        }
        if (command.review() != null) {
            BookView book = ownedResources.requireBook(record.bookId(), userId);
            reviewRepository.findByBookId(record.bookId()).ifPresentOrElse(
                    review -> reviewService.applyChanges(review, command.review(), book),
                    () -> reviewService.createFor(book, userId, command.review()));
        }
        if (command.bookReportPresent()) {
            bookReportService.writeFor(record, command.bookReport());
        }
        return load(record);
    }

    private ReadingReviewResult load(ReadingRecordView record) {
        ReviewResult review = reviewRepository.findByBookId(record.bookId()).map(ReviewResult::from).orElse(null);
        BookReportResult bookReport = bookReportService.findForRecord(record.readingRecordId())
                .map(BookReportResult::from).orElse(null);
        return new ReadingReviewResult(record.readingRecordId(), record.round(), record.bookId(),
                record.completed(), review, bookReport);
    }
}
