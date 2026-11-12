package com.chaekdami.review.application;

import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.port.BookReader;
import com.chaekdami.review.application.port.BookView;
import com.chaekdami.review.application.port.ReadingRecordReader;
import com.chaekdami.review.application.port.ReadingRecordView;
import com.chaekdami.review.domain.ReviewErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 다른 사용자의 회차와 책은 존재 여부도 드러내지 않도록 없는 것과 같은 404로 처리한다.
 */
@Component
@RequiredArgsConstructor
public class OwnedResources {

    private final ReadingRecordReader readingRecordReader;
    private final BookReader bookReader;

    public ReadingRecordView requireRecord(Long readingRecordId, Long userId) {
        return readingRecordReader.find(readingRecordId)
                .filter(record -> record.ownedBy(userId))
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.READING_RECORD_NOT_FOUND));
    }

    public BookView requireBook(Long bookId, Long userId) {
        return bookReader.find(bookId)
                .filter(book -> book.ownedBy(userId))
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.BOOK_NOT_FOUND));
    }
}
