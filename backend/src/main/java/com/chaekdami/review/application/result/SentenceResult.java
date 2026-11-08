package com.chaekdami.review.application.result;

import com.chaekdami.review.domain.Sentence;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record SentenceResult(Long sentenceId, Long readingRecordId, Long bookId, LocalDate readDate,
                             Integer pageNumber, String content,
                             LocalDateTime createdAt, LocalDateTime updatedAt) {

    public static SentenceResult from(Sentence sentence) {
        return new SentenceResult(sentence.getId(), sentence.getReadingRecordId(), sentence.getBookId(),
                sentence.getReadDate(), sentence.getPageNumber(), sentence.getContent(),
                sentence.getCreatedAt(), sentence.getUpdatedAt());
    }
}
