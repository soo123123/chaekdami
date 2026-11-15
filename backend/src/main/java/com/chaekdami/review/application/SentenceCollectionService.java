package com.chaekdami.review.application;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.review.application.port.BookReader;
import com.chaekdami.review.application.port.BookView;
import com.chaekdami.review.application.port.ReadingRecordReader;
import com.chaekdami.review.application.port.ReadingRecordView;
import com.chaekdami.review.application.result.BookSummary;
import com.chaekdami.review.application.result.SentenceCollectionCard;
import com.chaekdami.review.application.result.SentenceCollectionResult;
import com.chaekdami.review.domain.Sentence;
import com.chaekdami.review.infrastructure.SentenceRepository;
import com.chaekdami.review.infrastructure.SentenceRepository.CollectionStats;
import com.chaekdami.user.application.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SentenceCollectionService {

    private final SentenceRepository sentenceRepository;
    private final ReadingRecordReader readingRecordReader;
    private final BookReader bookReader;
    private final OwnedResources ownedResources;
    private final CurrentUser currentUser;
    private final KoreanTime koreanTime;

    /**
     * 읽는 중이어도 조회할 수 있다. 다른 사람의 모음집은 커뮤니티 API로만 본다.
     */
    public SentenceCollectionResult get(Long readingRecordId) {
        Long userId = currentUser.requireId();
        ReadingRecordView record = ownedResources.requireRecord(readingRecordId, userId);
        BookView book = ownedResources.requireBook(record.bookId(), userId);
        return new SentenceCollectionResult(
                record.readingRecordId(), record.round(), record.status(), BookSummary.from(book),
                record.startedAt(), record.completedAt(), record.isPublic(),
                SentenceCollectionAssembler.assemble(sentenceRepository.findAllByReadingRecordId(readingRecordId),
                        record.startedAt(), record.completedAt(), koreanTime.today()));
    }

    public PageResponse<SentenceCollectionCard> listMine(Long bookId, int page, int size) {
        Long userId = currentUser.requireId();
        PageRequest pageable = Paging.of(page, size);
        Page<CollectionStats> stats = bookId == null
                ? sentenceRepository.findCollectionStats(userId, pageable)
                : sentenceRepository.findCollectionStatsByBook(userId, bookId, pageable);

        List<Long> recordIds = stats.getContent().stream().map(CollectionStats::getReadingRecordId).toList();
        Map<Long, ReadingRecordView> records = readingRecordReader.findAll(recordIds).stream()
                .collect(Collectors.toMap(ReadingRecordView::readingRecordId, Function.identity()));
        Map<Long, BookView> books = bookReader.findAll(records.values().stream()
                .map(ReadingRecordView::bookId).distinct().toList());
        Map<Long, String> previews = sentenceRepository.findAllByReadingRecordIdIn(recordIds).stream()
                .collect(Collectors.groupingBy(Sentence::getReadingRecordId)).entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, entry -> entry.getValue().stream()
                        .min(SentenceCollectionAssembler.PAGE_ORDER).map(Sentence::getContent).orElse("")));

        List<SentenceCollectionCard> cards = stats.getContent().stream()
                .map(stat -> {
                    ReadingRecordView record = records.get(stat.getReadingRecordId());
                    BookView book = record == null ? null : books.get(record.bookId());
                    if (record == null || book == null) {
                        return null;
                    }
                    return new SentenceCollectionCard(record.readingRecordId(), record.round(), record.status(),
                            BookSummary.from(book), record.completedAt(), stat.getSentenceCount(),
                            stat.getLastReadDate(), previews.get(record.readingRecordId()));
                })
                .filter(Objects::nonNull)
                .toList();
        return new PageResponse<>(cards, stats.getNumber(), stats.getSize(), stats.getTotalElements(),
                stats.hasNext());
    }
}
