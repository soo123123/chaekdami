package com.chaekdami.review.presentation.dto;

import com.chaekdami.review.application.result.BookReportResult;

import java.time.LocalDateTime;

public record BookReportResponse(Long bookReportId, Long readingRecordId, Long bookId, String content,
                                 boolean isPublic, int revision,
                                 LocalDateTime createdAt, LocalDateTime updatedAt) {

    public static BookReportResponse from(BookReportResult result) {
        if (result == null) {
            return null;
        }
        return new BookReportResponse(result.bookReportId(), result.readingRecordId(), result.bookId(),
                result.content(), result.isPublic(), result.revision(), result.createdAt(), result.updatedAt());
    }
}
