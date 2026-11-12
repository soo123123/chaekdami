package com.chaekdami.review.application.result;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record SentenceCollectionCard(Long readingRecordId, int round, String status, BookSummary book,
                                     LocalDateTime completedAt, long sentenceCount, LocalDate lastReadDate,
                                     String previewSentence) {
}
