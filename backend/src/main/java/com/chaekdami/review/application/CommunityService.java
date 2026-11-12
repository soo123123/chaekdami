package com.chaekdami.review.application;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.port.BookView;
import com.chaekdami.review.application.port.ReadingRecordReader;
import com.chaekdami.review.application.result.CommunityAuthor;
import com.chaekdami.review.application.result.CommunityEntryDetail;
import com.chaekdami.review.application.result.CommunityEntrySummary;
import com.chaekdami.review.application.result.CommunitySummary;
import com.chaekdami.review.application.result.SentenceCollectionBody;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.infrastructure.BookReportRepository;
import com.chaekdami.review.infrastructure.CommunityQueryRepository;
import com.chaekdami.review.infrastructure.CommunityQueryRepository.EntryRow;
import com.chaekdami.review.infrastructure.CommunityQueryRepository.PreviewSentenceRow;
import com.chaekdami.review.infrastructure.SentenceRepository;
import com.chaekdami.user.application.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 같은 ISBN을 완독한 사용자끼리만 서로의 공개 모음집과 독후감을 본다.
 * 진입점은 내 서재의 책이고, 그 책의 ISBN으로 다른 사용자의 책을 묶는다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityService {

    public static final String LOCK_NOT_COMPLETED = "NOT_COMPLETED";
    public static final String LOCK_NO_ISBN = "NO_ISBN";
    private static final int PREVIEW_SENTENCE_COUNT = 3;

    private final CommunityQueryRepository communityQueryRepository;
    private final SentenceRepository sentenceRepository;
    private final BookReportRepository bookReportRepository;
    private final ReadingRecordReader readingRecordReader;
    private final OwnedResources ownedResources;
    private final CurrentUser currentUser;
    private final KoreanTime koreanTime;

    /**
     * 잠겨 있어도 200이다. 잠금 화면에서 완독자 수를 보여줘 완독 동기를 주기 위해서다.
     */
    public CommunitySummary summary(Long bookId) {
        Long userId = currentUser.requireId();
        BookView book = ownedResources.requireBook(bookId, userId);
        if (book.isbn() == null) {
            return new CommunitySummary(bookId, null, false, false, LOCK_NO_ISBN, 0, 0, 0);
        }
        boolean unlocked = readingRecordReader.hasCompletedRoundByIsbn(userId, book.isbn());
        CommunityQueryRepository.Counts counts = communityQueryRepository.counts(book.isbn());
        return new CommunitySummary(bookId, book.isbn(), true, unlocked, unlocked ? null : LOCK_NOT_COMPLETED,
                counts.completerCount(), counts.publicCollectionCount(), counts.publicBookReportCount());
    }

    public PageResponse<CommunityEntrySummary> entries(Long bookId, int page, int size) {
        Long userId = currentUser.requireId();
        String isbn = requireUnlockedIsbn(bookId, userId);
        PageRequest pageable = Paging.of(page, size);

        List<EntryRow> rows = communityQueryRepository.findEntries(isbn, pageable.getPageSize(), pageable.getOffset());
        long total = communityQueryRepository.countEntries(isbn);
        List<Long> collectionRecordIds = rows.stream()
                .filter(row -> row.sentenceCount() != null)
                .map(EntryRow::readingRecordId)
                .toList();
        Map<Long, List<CommunityEntrySummary.PreviewSentence>> previews = communityQueryRepository
                .findPreviewSentences(collectionRecordIds, PREVIEW_SENTENCE_COUNT).stream()
                .collect(Collectors.groupingBy(PreviewSentenceRow::readingRecordId,
                        Collectors.mapping(row -> new CommunityEntrySummary.PreviewSentence(
                                row.sentenceId(), row.content(), row.pageNumber()), Collectors.toList())));

        List<CommunityEntrySummary> items = rows.stream()
                .map(row -> new CommunityEntrySummary(row.readingRecordId(), row.round(), row.completedAt(),
                        new CommunityAuthor(row.userId(), row.nickname()), row.userId().equals(userId),
                        row.sentenceCount() == null ? null : new CommunityEntrySummary.SentenceCollectionPreview(
                                row.sentenceCount(), previews.getOrDefault(row.readingRecordId(), List.of())),
                        row.bookReportId() == null ? null : new CommunityEntrySummary.BookReportPreview(
                                row.bookReportId(), row.bookReportPreview(),
                                Objects.requireNonNullElse(row.bookReportLength(), 0))))
                .toList();
        return PageResponse.of(items, pageable.getPageNumber(), pageable.getPageSize(), total);
    }

    public CommunityEntryDetail entry(Long bookId, Long readingRecordId) {
        Long userId = currentUser.requireId();
        String isbn = requireUnlockedIsbn(bookId, userId);
        EntryRow row = communityQueryRepository.findEntry(isbn, readingRecordId)
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.COMMUNITY_ENTRY_NOT_FOUND));

        CommunityEntryDetail.SentenceCollection collection = null;
        if (row.sentenceCount() != null) {
            SentenceCollectionBody body = SentenceCollectionAssembler.assemble(
                    sentenceRepository.findAllByReadingRecordId(readingRecordId),
                    row.startedAt(), row.completedAt(), koreanTime.today());
            collection = new CommunityEntryDetail.SentenceCollection(body.readingPeriodDays(),
                    body.recordedDayCount(), body.sentenceCount(), body.days());
        }
        CommunityEntryDetail.BookReport bookReport = row.bookReportId() == null ? null
                : bookReportRepository.findById(row.bookReportId())
                .map(report -> new CommunityEntryDetail.BookReport(report.getId(), report.getContent(),
                        report.getCreatedAt(), report.getUpdatedAt()))
                .orElse(null);

        return new CommunityEntryDetail(row.readingRecordId(), row.round(), row.completedAt(),
                new CommunityAuthor(row.userId(), row.nickname()), row.userId().equals(userId),
                collection, bookReport);
    }

    private String requireUnlockedIsbn(Long bookId, Long userId) {
        BookView book = ownedResources.requireBook(bookId, userId);
        if (book.isbn() == null || !readingRecordReader.hasCompletedRoundByIsbn(userId, book.isbn())) {
            throw new BusinessException(ReviewErrorCode.COMMUNITY_LOCKED);
        }
        return book.isbn();
    }
}
