package com.chaekdami.reading.application;

import java.util.List;

public record ReadingStatsResult(
        int totalMinutes,
        int averageMinutes,
        int completedBooks,
        int totalPages,
        int readingDays,
        int goalBooks,
        int goalTarget,
        List<Bucket> weekly,
        List<Bucket> monthly,
        List<Bucket> daily
) {
    public record Bucket(String label, int minutes) {
    }
}
