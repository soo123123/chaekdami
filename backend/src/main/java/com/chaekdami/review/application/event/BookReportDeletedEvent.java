package com.chaekdami.review.application.event;

public record BookReportDeletedEvent(Long userId, Long readingRecordId, Long bookReportId) {
}
