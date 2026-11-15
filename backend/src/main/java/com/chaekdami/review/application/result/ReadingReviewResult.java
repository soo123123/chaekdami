package com.chaekdami.review.application.result;

public record ReadingReviewResult(Long readingRecordId, int round, Long bookId, boolean canWrite,
                                  ReviewResult review, BookReportResult bookReport) {
}
