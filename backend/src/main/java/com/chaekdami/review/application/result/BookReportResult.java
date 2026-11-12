package com.chaekdami.review.application.result;

import com.chaekdami.review.domain.BookReport;

import java.time.LocalDateTime;

public record BookReportResult(Long bookReportId, Long readingRecordId, Long bookId, String content,
                               boolean isPublic, int revision,
                               LocalDateTime createdAt, LocalDateTime updatedAt) {

    public static BookReportResult from(BookReport report) {
        return new BookReportResult(report.getId(), report.getReadingRecordId(), report.getBookId(),
                report.getContent(), report.isPublic(), report.getRevision(),
                report.getCreatedAt(), report.getUpdatedAt());
    }
}
