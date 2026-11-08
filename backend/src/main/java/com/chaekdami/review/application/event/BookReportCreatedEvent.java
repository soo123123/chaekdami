package com.chaekdami.review.application.event;

public record BookReportCreatedEvent(Long userId, Long readingRecordId, Long bookReportId, int revision) {
}
