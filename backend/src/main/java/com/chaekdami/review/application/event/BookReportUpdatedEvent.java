package com.chaekdami.review.application.event;

/**
 * 본문이 바뀐 경우에만 발행한다. 공개 여부만 바꾸면 발행하지 않는다.
 */
public record BookReportUpdatedEvent(Long userId, Long readingRecordId, Long bookReportId, int revision) {
}
