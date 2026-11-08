package com.chaekdami.review.application;

import com.chaekdami.review.application.result.SentenceCollectionBody;
import com.chaekdami.review.domain.Sentence;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.TreeMap;
import java.util.stream.Collectors;

public final class SentenceCollectionAssembler {

    static final Comparator<Sentence> PAGE_ORDER = Comparator
            .comparing(Sentence::getPageNumber, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(Sentence::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(Sentence::getId, Comparator.nullsLast(Comparator.naturalOrder()));

    private SentenceCollectionAssembler() {
    }

    /**
     * n일차의 기준일은 독서 시작일이다. 시작 전에 남긴 문장이 있으면 그 날짜를 기준으로 당긴다.
     */
    public static SentenceCollectionBody assemble(List<Sentence> sentences, LocalDateTime startedAt,
                                                  LocalDateTime completedAt, LocalDate today) {
        TreeMap<LocalDate, List<Sentence>> byDate = sentences.stream()
                .collect(Collectors.groupingBy(Sentence::getReadDate, TreeMap::new, Collectors.toList()));

        LocalDate firstReadDate = byDate.isEmpty() ? null : byDate.firstKey();
        LocalDate lastReadDate = byDate.isEmpty() ? null : byDate.lastKey();
        LocalDate baseDate = earliest(startedAt != null ? startedAt.toLocalDate() : null, firstReadDate);

        List<SentenceCollectionBody.Day> days = byDate.entrySet().stream()
                .map(entry -> new SentenceCollectionBody.Day(
                        entry.getKey(),
                        (int) ChronoUnit.DAYS.between(baseDate, entry.getKey()) + 1,
                        entry.getValue().stream().sorted(PAGE_ORDER).map(SentenceCollectionAssembler::toItem).toList()))
                .toList();

        return new SentenceCollectionBody(
                readingPeriodDays(baseDate, completedAt, lastReadDate, today),
                days.size(),
                sentences.size(),
                days);
    }

    private static int readingPeriodDays(LocalDate baseDate, LocalDateTime completedAt,
                                         LocalDate lastReadDate, LocalDate today) {
        if (baseDate == null) {
            return 0;
        }
        LocalDate endDate = completedAt != null ? completedAt.toLocalDate() : today;
        if (lastReadDate != null && lastReadDate.isAfter(endDate)) {
            endDate = lastReadDate;
        }
        return (int) Math.max(1, ChronoUnit.DAYS.between(baseDate, endDate) + 1);
    }

    private static LocalDate earliest(LocalDate first, LocalDate second) {
        if (first == null) {
            return second;
        }
        if (second == null) {
            return first;
        }
        return first.isBefore(second) ? first : second;
    }

    private static SentenceCollectionBody.Item toItem(Sentence sentence) {
        return new SentenceCollectionBody.Item(sentence.getId(), sentence.getContent(), sentence.getPageNumber(),
                sentence.getCreatedAt(), sentence.getUpdatedAt());
    }
}
