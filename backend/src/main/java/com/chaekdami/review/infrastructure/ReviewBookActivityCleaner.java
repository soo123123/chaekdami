package com.chaekdami.review.infrastructure;

import com.chaekdami.reading.application.port.BookActivityCleaner;
import com.chaekdami.review.application.ReviewCleanupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 책 삭제(BE1)의 독후활동 정리를 {@link ReviewCleanupService#deleteAllOfBook}으로 한다.
 */
@Component
@RequiredArgsConstructor
public class ReviewBookActivityCleaner implements BookActivityCleaner {

    private final ReviewCleanupService reviewCleanupService;

    @Override
    public void deleteAllOfBook(Long bookId) {
        reviewCleanupService.deleteAllOfBook(bookId);
    }
}
