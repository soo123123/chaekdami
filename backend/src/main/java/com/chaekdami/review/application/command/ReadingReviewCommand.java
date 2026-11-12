package com.chaekdami.review.application.command;

/**
 * {@code bookReportPresent}가 true이고 {@code bookReport}가 null이거나 본문이 비어 있으면 독후감을 지운다.
 * {@code review}가 null이면 리뷰는 건드리지 않는다.
 */
public record ReadingReviewCommand(ReviewWriteCommand review, boolean bookReportPresent,
                                   BookReportCommand bookReport) {
}
