package com.chaekdami.review.presentation.dto;

import com.chaekdami.review.application.result.SentenceCollectionCard;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record SentenceCollectionCardResponse(Long readingRecordId, int round, String status, Book book,
                                             LocalDateTime completedAt, long sentenceCount,
                                             LocalDate lastReadDate, String previewSentence) {

    public static SentenceCollectionCardResponse from(SentenceCollectionCard card) {
        return new SentenceCollectionCardResponse(card.readingRecordId(), card.round(), card.status(),
                new Book(card.book().bookId(), card.book().title(), card.book().author(), card.book().coverUrl()),
                card.completedAt(), card.sentenceCount(), card.lastReadDate(), card.previewSentence());
    }

    public record Book(Long bookId, String title, String author, String coverUrl) {
    }
}
