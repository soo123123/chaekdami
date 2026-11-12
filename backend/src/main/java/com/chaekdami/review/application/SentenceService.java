package com.chaekdami.review.application;

import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.command.SentenceCreateCommand;
import com.chaekdami.review.application.command.SentenceUpdateCommand;
import com.chaekdami.review.application.event.SentenceCreatedEvent;
import com.chaekdami.review.application.port.BookReader;
import com.chaekdami.review.application.port.BookView;
import com.chaekdami.review.application.port.ReadingRecordView;
import com.chaekdami.review.application.result.SentenceResult;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.domain.Sentence;
import com.chaekdami.review.infrastructure.SentenceRepository;
import com.chaekdami.user.application.CurrentUser;
import com.chaekdami.user.application.exception.InvalidRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SentenceService {

    private final SentenceRepository sentenceRepository;
    private final OwnedResources ownedResources;
    private final BookReader bookReader;
    private final CurrentUser currentUser;
    private final KoreanTime koreanTime;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 회차 상태는 보지 않는다. 마지막 날에는 세션 저장으로 완독 처리된 뒤에 문장이 올라온다.
     */
    @Transactional
    public SentenceResult create(Long readingRecordId, SentenceCreateCommand command) {
        Long userId = currentUser.requireId();
        ReadingRecordView record = ownedResources.requireRecord(readingRecordId, userId);
        return save(userId, record, normalizeContent(command.content(), "content"),
                validPageNumber(command.pageNumber(), record.bookId()));
    }

    /**
     * BE1 독서 세션 저장({@code POST /api/reading-sessions})이 같은 트랜잭션에서 요청의 {@code sentence}로 호출한다.
     * 문장이 비어 있으면 저장하지 않고, 1쪽 미만의 쪽 번호는 쪽 번호 없이 저장한다.
     */
    @Transactional
    public Optional<SentenceResult> recordFromSession(Long userId, Long readingRecordId,
                                                      String sentence, Integer pageNumber) {
        if (sentence == null || sentence.isBlank()) {
            return Optional.empty();
        }
        ReadingRecordView record = ownedResources.requireRecord(readingRecordId, userId);
        Integer page = pageNumber != null && pageNumber >= 1 ? pageNumber : null;
        return Optional.of(save(userId, record, normalizeContent(sentence, "sentence"),
                validPageNumber(page, record.bookId())));
    }

    private SentenceResult save(Long userId, ReadingRecordView record, String content, Integer pageNumber) {
        Sentence sentence = sentenceRepository.save(Sentence.builder()
                .userId(userId)
                .readingRecordId(record.readingRecordId())
                .bookId(record.bookId())
                .readDate(koreanTime.today())
                .pageNumber(pageNumber)
                .content(content)
                .build());
        eventPublisher.publishEvent(new SentenceCreatedEvent(
                userId, record.readingRecordId(), sentence.getId(), sentence.getReadDate()));
        return SentenceResult.from(sentence);
    }

    public List<SentenceResult> list(Long readingRecordId) {
        Long userId = currentUser.requireId();
        ownedResources.requireRecord(readingRecordId, userId);
        return sentenceRepository.findAllByReadingRecordIdOrderByCreatedAtDescIdDesc(readingRecordId).stream()
                .map(SentenceResult::from)
                .toList();
    }

    @Transactional
    public SentenceResult update(Long sentenceId, SentenceUpdateCommand command) {
        Sentence sentence = requireOwnSentence(sentenceId);
        if (command.content() != null) {
            sentence.changeContent(normalizeContent(command.content(), "content"));
        }
        if (command.pageNumberPresent()) {
            sentence.changePageNumber(validPageNumber(command.pageNumber(), sentence.getBookId()));
        }
        sentenceRepository.flush();
        return SentenceResult.from(sentence);
    }

    @Transactional
    public void delete(Long sentenceId) {
        sentenceRepository.delete(requireOwnSentence(sentenceId));
    }

    private Sentence requireOwnSentence(Long sentenceId) {
        Long userId = currentUser.requireId();
        return sentenceRepository.findById(sentenceId)
                .filter(sentence -> sentence.ownedBy(userId))
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.SENTENCE_NOT_FOUND));
    }

    private static String normalizeContent(String content, String field) {
        String trimmed = content == null ? "" : content.strip();
        if (trimmed.isEmpty()) {
            throw new InvalidRequestException(field, "문장을 입력해야 합니다.");
        }
        if (trimmed.length() > Sentence.MAX_CONTENT_LENGTH) {
            throw new InvalidRequestException(field,
                    "문장은 " + Sentence.MAX_CONTENT_LENGTH + "자 이하여야 합니다.");
        }
        return trimmed;
    }

    private Integer validPageNumber(Integer pageNumber, Long bookId) {
        if (pageNumber == null) {
            return null;
        }
        Integer totalPages = bookReader.find(bookId).map(BookView::totalPages).orElse(null);
        boolean overTotal = totalPages != null && totalPages > 0 && pageNumber > totalPages;
        if (pageNumber < 1 || overTotal) {
            String range = totalPages != null && totalPages > 0 ? "1 이상 " + totalPages + " 이하" : "1 이상";
            throw new InvalidRequestException("pageNumber", "쪽 번호는 " + range + "여야 합니다.");
        }
        return pageNumber;
    }
}
