package com.chaekdami.review.application.result;

import java.time.LocalDateTime;
import java.util.List;

/**
 * {@code sentenceCollection.days}는 내 모음집 조회와 같은 형식이다. 비공개인 쪽은 null이다.
 */
public record CommunityEntryDetail(Long readingRecordId, int round, LocalDateTime completedAt,
                                   CommunityAuthor author, boolean isMine,
                                   SentenceCollection sentenceCollection, BookReport bookReport) {

    public record SentenceCollection(int readingPeriodDays, int recordedDayCount, int sentenceCount,
                                     List<SentenceCollectionBody.Day> days) {
    }

    public record BookReport(Long bookReportId, String content, LocalDateTime createdAt, LocalDateTime updatedAt) {
    }
}
