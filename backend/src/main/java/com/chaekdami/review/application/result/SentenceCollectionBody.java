package com.chaekdami.review.application.result;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record SentenceCollectionBody(int readingPeriodDays, int recordedDayCount, int sentenceCount,
                                     List<Day> days) {

    public record Day(LocalDate readDate, int dayNumber, List<Item> sentences) {
    }

    public record Item(Long sentenceId, String content, Integer pageNumber,
                       LocalDateTime createdAt, LocalDateTime updatedAt) {
    }
}
