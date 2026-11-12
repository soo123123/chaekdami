package com.chaekdami.review.application;

import com.chaekdami.review.application.result.SentenceCollectionBody;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static com.chaekdami.review.ReviewFixtures.sentence;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SentenceCollectionAssemblerTest {

    private static final LocalDate OCT_1 = LocalDate.of(2026, 10, 1);

    @Test
    void groupsByDateAndSortsByPageWithMissingPagesLast() {
        var sentences = List.of(
                sentence(1L, 1L, 3L, OCT_1.plusDays(2), null, "쪽 없음"),
                sentence(2L, 1L, 3L, OCT_1, 40, "40쪽"),
                sentence(3L, 1L, 3L, OCT_1.plusDays(2), 90, "90쪽"),
                sentence(4L, 1L, 3L, OCT_1, 12, "12쪽"),
                sentence(5L, 1L, 3L, OCT_1.plusDays(2), 90, "90쪽 두 번째"));

        SentenceCollectionBody body = SentenceCollectionAssembler.assemble(
                sentences, OCT_1.atTime(20, 0), null, OCT_1.plusDays(7));

        assertEquals(2, body.days().size());
        assertEquals(OCT_1, body.days().get(0).readDate());
        assertEquals(1, body.days().get(0).dayNumber());
        assertEquals(List.of(4L, 2L), body.days().get(0).sentences().stream()
                .map(SentenceCollectionBody.Item::sentenceId).toList());
        assertEquals(3, body.days().get(1).dayNumber());
        assertEquals(List.of(3L, 5L, 1L), body.days().get(1).sentences().stream()
                .map(SentenceCollectionBody.Item::sentenceId).toList());
        assertEquals(8, body.readingPeriodDays());
        assertEquals(2, body.recordedDayCount());
        assertEquals(5, body.sentenceCount());
    }

    @Test
    void completedRoundCountsUntilTheCompletionDate() {
        var sentences = List.of(sentence(1L, 1L, 3L, OCT_1.plusDays(4), 1, "문장"));

        SentenceCollectionBody body = SentenceCollectionAssembler.assemble(
                sentences, OCT_1.atTime(20, 0), LocalDateTime.of(2026, 10, 20, 22, 0), OCT_1.plusDays(60));

        assertEquals(20, body.readingPeriodDays());
        assertEquals(5, body.days().get(0).dayNumber());
    }

    @Test
    void withoutStartDateTheFirstSentenceIsDayOne() {
        var sentences = List.of(
                sentence(1L, 1L, 3L, OCT_1.plusDays(3), 1, "첫 문장"),
                sentence(2L, 1L, 3L, OCT_1.plusDays(5), 2, "둘째 문장"));

        SentenceCollectionBody body = SentenceCollectionAssembler.assemble(
                sentences, null, null, OCT_1.plusDays(5));

        assertEquals(1, body.days().get(0).dayNumber());
        assertEquals(3, body.days().get(1).dayNumber());
        assertEquals(3, body.readingPeriodDays());
    }

    @Test
    void sentenceBeforeStartMovesDayOneEarlier() {
        var sentences = List.of(sentence(1L, 1L, 3L, OCT_1.minusDays(1), 1, "시작 전 문장"));

        SentenceCollectionBody body = SentenceCollectionAssembler.assemble(
                sentences, OCT_1.atTime(20, 0), null, OCT_1);

        assertEquals(1, body.days().get(0).dayNumber());
        assertEquals(2, body.readingPeriodDays());
    }

    @Test
    void emptyCollection() {
        SentenceCollectionBody body = SentenceCollectionAssembler.assemble(List.of(), null, null, OCT_1);

        assertTrue(body.days().isEmpty());
        assertEquals(0, body.sentenceCount());
        assertEquals(0, body.readingPeriodDays());
    }
}
