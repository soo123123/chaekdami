package com.chaekdami.review.presentation.dto;

import com.chaekdami.review.application.result.ReadingReviewResult;

public record ReadingReviewResponse(Long readingRecordId, int round, Long bookId, boolean canWrite,
                                    ReviewResponse review, BookReportResponse bookReport) {

    public static ReadingReviewResponse from(ReadingReviewResult result) {
        return new ReadingReviewResponse(result.readingRecordId(), result.round(), result.bookId(),
                result.canWrite(), ReviewResponse.from(result.review()),
                BookReportResponse.from(result.bookReport()));
    }
}
