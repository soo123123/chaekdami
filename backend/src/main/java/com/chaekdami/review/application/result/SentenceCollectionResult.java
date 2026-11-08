package com.chaekdami.review.application.result;

import java.time.LocalDateTime;

public record SentenceCollectionResult(Long readingRecordId, int round, String status, BookSummary book,
                                       LocalDateTime startedAt, LocalDateTime completedAt, boolean isPublic,
                                       SentenceCollectionBody body) {
}
