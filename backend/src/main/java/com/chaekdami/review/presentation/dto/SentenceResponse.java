package com.chaekdami.review.presentation.dto;

import com.chaekdami.review.application.result.SentenceResult;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record SentenceResponse(Long sentenceId, Long readingRecordId, Long bookId, LocalDate readDate,
                               Integer pageNumber, String content,
                               LocalDateTime createdAt, LocalDateTime updatedAt) {

    public static SentenceResponse from(SentenceResult result) {
        return new SentenceResponse(result.sentenceId(), result.readingRecordId(), result.bookId(),
                result.readDate(), result.pageNumber(), result.content(), result.createdAt(), result.updatedAt());
    }
}
