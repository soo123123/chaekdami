package com.chaekdami.review.application;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.port.BookReader;
import com.chaekdami.review.application.port.ReadingRecordReader;
import com.chaekdami.review.application.result.CommunityEntryDetail;
import com.chaekdami.review.application.result.CommunityEntrySummary;
import com.chaekdami.review.application.result.CommunitySummary;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.infrastructure.BookReportRepository;
import com.chaekdami.review.infrastructure.CommunityQueryRepository;
import com.chaekdami.review.infrastructure.CommunityQueryRepository.EntryRow;
import com.chaekdami.review.infrastructure.CommunityQueryRepository.PreviewSentenceRow;
import com.chaekdami.review.infrastructure.SentenceRepository;
import com.chaekdami.user.application.CurrentUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static com.chaekdami.review.ReviewFixtures.book;
import static com.chaekdami.review.ReviewFixtures.sentence;
import static com.chaekdami.review.ReviewFixtures.signIn;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CommunityServiceTest {

    private static final String ISBN = "9791162540640";
    private static final LocalDateTime COMPLETED_AT = LocalDateTime.of(2026, 10, 20, 22, 0);

    private final CommunityQueryRepository queryRepository = mock(CommunityQueryRepository.class);
    private final SentenceRepository sentenceRepository = mock(SentenceRepository.class);
    private final BookReportRepository bookReportRepository = mock(BookReportRepository.class);
    private final ReadingRecordReader readingRecordReader = mock(ReadingRecordReader.class);
    private final BookReader bookReader = mock(BookReader.class);
    private CommunityService service;

    @BeforeEach
    void setUp() {
        service = new CommunityService(queryRepository, sentenceRepository, bookReportRepository,
                readingRecordReader, new OwnedResources(readingRecordReader, bookReader), new CurrentUser(),
                new KoreanTime());
        signIn(1L);
        when(bookReader.find(7L)).thenReturn(Optional.of(book(7L, 1L, ISBN, 400)));
        when(queryRepository.counts(ISBN)).thenReturn(new CommunityQueryRepository.Counts(23, 11, 6));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void summaryIsVisibleWhileLocked() {
        when(readingRecordReader.hasCompletedRoundByIsbn(1L, ISBN)).thenReturn(false);

        CommunitySummary summary = service.summary(7L);

        assertTrue(summary.available());
        assertFalse(summary.unlocked());
        assertEquals(CommunityService.LOCK_NOT_COMPLETED, summary.lockReason());
        assertEquals(23, summary.completerCount());
    }

    @Test
    void bookWithoutIsbnHasNoCommunity() {
        when(bookReader.find(8L)).thenReturn(Optional.of(book(8L, 1L, null, 120)));

        CommunitySummary summary = service.summary(8L);

        assertFalse(summary.available());
        assertEquals(CommunityService.LOCK_NO_ISBN, summary.lockReason());
        BusinessException exception = assertThrows(BusinessException.class, () -> service.entries(8L, 0, 20));
        assertEquals(ReviewErrorCode.COMMUNITY_LOCKED, exception.getErrorCode());
    }

    @Test
    void entriesNeedACompletedRoundOfTheSameIsbn() {
        when(readingRecordReader.hasCompletedRoundByIsbn(1L, ISBN)).thenReturn(false);

        BusinessException exception = assertThrows(BusinessException.class, () -> service.entries(7L, 0, 20));

        assertEquals(ReviewErrorCode.COMMUNITY_LOCKED, exception.getErrorCode());
        verify(queryRepository, never()).findEntries(any(), any(Integer.class), any(Long.class));
    }

    @Test
    void everyCompletedRoundIsItsOwnEntry() {
        when(readingRecordReader.hasCompletedRoundByIsbn(1L, ISBN)).thenReturn(true);
        when(queryRepository.findEntries(ISBN, 20, 0)).thenReturn(List.of(
                new EntryRow(32L, 2, null, COMPLETED_AT.plusDays(30), 4L, "책벌레", 3L, null, null, null),
                new EntryRow(31L, 1, null, COMPLETED_AT, 4L, "책벌레", null, 9L, "처음 150자", 1340),
                new EntryRow(30L, 1, null, COMPLETED_AT.minusDays(1), 1L, "나", 1L, null, null, null)));
        when(queryRepository.countEntries(ISBN)).thenReturn(3L);
        when(queryRepository.findPreviewSentences(List.of(32L, 30L), 3)).thenReturn(List.of(
                new PreviewSentenceRow(32L, 101L, "첫 문장", 12),
                new PreviewSentenceRow(30L, 201L, "내 문장", null)));

        PageResponse<CommunityEntrySummary> page = service.entries(7L, 0, 20);

        assertEquals(3, page.items().size());
        CommunityEntrySummary second = page.items().get(0);
        assertEquals(2, second.round());
        assertEquals("책벌레", second.author().nickname());
        assertNull(second.bookReport());
        assertEquals(1, second.sentenceCollection().previewSentences().size());
        CommunityEntrySummary first = page.items().get(1);
        assertNull(first.sentenceCollection());
        assertEquals(1340, first.bookReport().length());
        assertTrue(page.items().get(2).isMine());
        assertFalse(page.hasNext());
    }

    @Test
    void entryDetailUsesTheCollectionFormat() {
        when(readingRecordReader.hasCompletedRoundByIsbn(1L, ISBN)).thenReturn(true);
        when(queryRepository.findEntry(ISBN, 31L)).thenReturn(Optional.of(new EntryRow(
                31L, 1, LocalDateTime.of(2026, 10, 1, 20, 0), COMPLETED_AT, 4L, "책벌레", 1L, null, null, null)));
        when(sentenceRepository.findAllByReadingRecordId(31L))
                .thenReturn(List.of(sentence(101L, 4L, 31L, LocalDate.of(2026, 10, 3), 68, "남의 공개 문장")));

        CommunityEntryDetail detail = service.entry(7L, 31L);

        assertEquals(3, detail.sentenceCollection().days().get(0).dayNumber());
        assertEquals(20, detail.sentenceCollection().readingPeriodDays());
        assertNull(detail.bookReport());
    }

    @Test
    void privateOrUnfinishedRoundIsNotAnEntry() {
        when(readingRecordReader.hasCompletedRoundByIsbn(1L, ISBN)).thenReturn(true);
        when(queryRepository.findEntry(ISBN, 40L)).thenReturn(Optional.empty());

        BusinessException exception = assertThrows(BusinessException.class, () -> service.entry(7L, 40L));

        assertEquals(ReviewErrorCode.COMMUNITY_ENTRY_NOT_FOUND, exception.getErrorCode());
    }
}
