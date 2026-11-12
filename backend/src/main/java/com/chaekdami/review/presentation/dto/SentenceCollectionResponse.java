package com.chaekdami.review.presentation.dto;

import com.chaekdami.review.application.result.BookSummary;
import com.chaekdami.review.application.result.SentenceCollectionBody;
import com.chaekdami.review.application.result.SentenceCollectionResult;

import java.time.LocalDateTime;
import java.util.List;

public record SentenceCollectionResponse(Long readingRecordId, int round, String status, BookSummary book,
                                         LocalDateTime startedAt, LocalDateTime completedAt, boolean isPublic,
                                         int readingPeriodDays, int recordedDayCount, int sentenceCount,
                                         List<SentenceCollectionBody.Day> days) {

    public static SentenceCollectionResponse from(SentenceCollectionResult result) {
        SentenceCollectionBody body = result.body();
        return new SentenceCollectionResponse(result.readingRecordId(), result.round(), result.status(),
                result.book(), result.startedAt(), result.completedAt(), result.isPublic(),
                body.readingPeriodDays(), body.recordedDayCount(), body.sentenceCount(), body.days());
    }
}
