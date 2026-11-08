package com.chaekdami.review.application;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.port.BookReader;
import com.chaekdami.review.application.port.ReadingRecordReader;
import com.chaekdami.review.application.result.SentenceCollectionCard;
import com.chaekdami.review.application.result.SentenceCollectionResult;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.infrastructure.SentenceCollectionSettingRepository;
import com.chaekdami.review.infrastructure.SentenceRepository;
import com.chaekdami.review.infrastructure.SentenceRepository.CollectionStats;
import com.chaekdami.user.application.CurrentUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.chaekdami.review.ReviewFixtures.book;
import static com.chaekdami.review.ReviewFixtures.record;
import static com.chaekdami.review.ReviewFixtures.sentence;
import static com.chaekdami.review.ReviewFixtures.signIn;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SentenceCollectionServiceTest {

    private static final LocalDate OCT_1 = LocalDate.of(2026, 10, 1);

    private final SentenceRepository sentenceRepository = mock(SentenceRepository.class);
    private final SentenceCollectionSettingRepository settingRepository = mock(SentenceCollectionSettingRepository.class);
    private final ReadingRecordReader readingRecordReader = mock(ReadingRecordReader.class);
    private final BookReader bookReader = mock(BookReader.class);
    private SentenceCollectionService service;

    @BeforeEach
    void setUp() {
        service = new SentenceCollectionService(sentenceRepository, settingRepository, readingRecordReader,
                bookReader, new OwnedResources(readingRecordReader, bookReader), new CurrentUser(),
                new KoreanTime(Clock.fixed(Instant.parse("2026-10-05T03:00:00Z"), ZoneOffset.UTC)));
        signIn(1L);
        when(bookReader.find(7L)).thenReturn(Optional.of(book(7L, 1L, "9791162540640", 400)));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void ownerSeesTheCollectionWhileStillReading() {
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 1L, 7L, "IN_PROGRESS")));
        when(settingRepository.findByReadingRecordId(3L)).thenReturn(Optional.empty());
        when(sentenceRepository.findAllByReadingRecordId(3L))
                .thenReturn(List.of(sentence(1L, 1L, 3L, OCT_1, 12, "문장")));

        SentenceCollectionResult result = service.get(3L);

        assertEquals("IN_PROGRESS", result.status());
        assertFalse(result.isPublic());
        assertEquals(1, result.body().sentenceCount());
        assertEquals(5, result.body().readingPeriodDays());
    }

    @Test
    void anotherUsersCollectionLooksMissing() {
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 2L, 7L, "COMPLETED")));

        BusinessException exception = assertThrows(BusinessException.class, () -> service.get(3L));

        assertEquals(ReviewErrorCode.READING_RECORD_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    void myCollectionsUseTheEarliestPageAsPreview() {
        CollectionStats stats = mock(CollectionStats.class);
        when(stats.getReadingRecordId()).thenReturn(3L);
        when(stats.getSentenceCount()).thenReturn(2L);
        when(stats.getLastReadDate()).thenReturn(OCT_1.plusDays(1));
        when(sentenceRepository.findCollectionStats(eq(1L), any()))
                .thenReturn(new PageImpl<>(List.of(stats), PageRequest.of(0, 20), 1));
        when(readingRecordReader.findAll(List.of(3L))).thenReturn(List.of(record(3L, 1L, 7L, "IN_PROGRESS")));
        when(bookReader.findAll(List.of(7L))).thenReturn(Map.of(7L, book(7L, 1L, "9791162540640", 400)));
        when(sentenceRepository.findAllByReadingRecordIdIn(List.of(3L))).thenReturn(List.of(
                sentence(1L, 1L, 3L, OCT_1.plusDays(1), 90, "뒤쪽 문장"),
                sentence(2L, 1L, 3L, OCT_1, 12, "앞쪽 문장")));

        PageResponse<SentenceCollectionCard> page = service.listMine(null, 0, 20);

        assertEquals(1, page.items().size());
        assertEquals("앞쪽 문장", page.items().get(0).previewSentence());
        assertEquals(2L, page.items().get(0).sentenceCount());
        assertFalse(page.hasNext());
    }

    @Test
    void visibilityIsStoredPerRound() {
        when(readingRecordReader.find(3L)).thenReturn(Optional.of(record(3L, 1L, 7L, "IN_PROGRESS")));

        service.changeVisibility(3L, true);

        verify(settingRepository).upsertVisibility(eq(3L), eq(1L), eq(7L), eq(true), any());
    }
}
