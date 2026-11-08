package com.chaekdami.review.application;

import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.command.BookReportCommand;
import com.chaekdami.review.application.event.BookReportCreatedEvent;
import com.chaekdami.review.application.event.BookReportDeletedEvent;
import com.chaekdami.review.application.event.BookReportUpdatedEvent;
import com.chaekdami.review.application.port.ReadingRecordView;
import com.chaekdami.review.application.result.BookReportResult;
import com.chaekdami.review.domain.BookReport;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.infrastructure.BookReportRepository;
import com.chaekdami.user.application.CurrentUser;
import com.chaekdami.user.application.exception.InvalidRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookReportService implements BookReportReader {

    private final BookReportRepository bookReportRepository;
    private final CurrentUser currentUser;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public Optional<BookReportResult> find(Long bookReportId) {
        return bookReportRepository.findById(bookReportId).map(BookReportResult::from);
    }

    public BookReportResult get(Long bookReportId) {
        return BookReportResult.from(requireOwn(bookReportId));
    }

    @Transactional
    public BookReportResult update(Long bookReportId, BookReportCommand command) {
        BookReport report = requireOwn(bookReportId);
        if (command.content() != null) {
            String content = normalizeContent(command.content());
            if (content.isEmpty()) {
                throw new InvalidRequestException("content", "독후감을 입력해야 합니다. 지우려면 삭제를 사용하세요.");
            }
            applyContent(report, content);
        }
        if (command.isPublic() != null) {
            report.changeVisibility(command.isPublic());
        }
        bookReportRepository.flush();
        return BookReportResult.from(report);
    }

    @Transactional
    public void delete(Long bookReportId) {
        remove(requireOwn(bookReportId));
    }

    /**
     * 회차 소유권과 완독 여부는 호출하는 쪽에서 확인한다.
     * command가 null이거나 본문이 빈 문자열이면 지우고, 본문이 null이면 공개 여부만 바꾼다.
     */
    void writeFor(ReadingRecordView record, BookReportCommand command) {
        Optional<BookReport> existing = bookReportRepository.findByReadingRecordId(record.readingRecordId());
        if (command != null && command.content() == null) {
            existing.filter(report -> command.isPublic() != null).ifPresent(report -> {
                report.changeVisibility(command.isPublic());
                bookReportRepository.flush();
            });
            return;
        }
        String content = command == null ? "" : normalizeContent(command.content());
        if (content.isEmpty()) {
            existing.ifPresent(this::remove);
            return;
        }
        if (existing.isPresent()) {
            BookReport report = existing.get();
            applyContent(report, content);
            if (command.isPublic() != null) {
                report.changeVisibility(command.isPublic());
            }
            bookReportRepository.flush();
            return;
        }
        BookReport report;
        try {
            report = bookReportRepository.saveAndFlush(BookReport.builder()
                    .userId(record.userId())
                    .readingRecordId(record.readingRecordId())
                    .bookId(record.bookId())
                    .content(content)
                    .isPublic(Boolean.TRUE.equals(command.isPublic()))
                    .build());
        } catch (DataIntegrityViolationException exception) {
            throw new BusinessException(ReviewErrorCode.BOOK_REPORT_ALREADY_EXISTS);
        }
        eventPublisher.publishEvent(new BookReportCreatedEvent(
                report.getUserId(), report.getReadingRecordId(), report.getId(), report.getRevision()));
    }

    Optional<BookReport> findForRecord(Long readingRecordId) {
        return bookReportRepository.findByReadingRecordId(readingRecordId);
    }

    private void applyContent(BookReport report, String content) {
        if (report.changeContent(content)) {
            eventPublisher.publishEvent(new BookReportUpdatedEvent(
                    report.getUserId(), report.getReadingRecordId(), report.getId(), report.getRevision()));
        }
    }

    private void remove(BookReport report) {
        bookReportRepository.delete(report);
        eventPublisher.publishEvent(new BookReportDeletedEvent(
                report.getUserId(), report.getReadingRecordId(), report.getId()));
    }

    private BookReport requireOwn(Long bookReportId) {
        Long userId = currentUser.requireId();
        return bookReportRepository.findById(bookReportId)
                .filter(report -> report.ownedBy(userId))
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.BOOK_REPORT_NOT_FOUND));
    }

    private static String normalizeContent(String content) {
        String trimmed = content == null ? "" : content.strip();
        if (trimmed.length() > BookReport.MAX_CONTENT_LENGTH) {
            throw new InvalidRequestException("content",
                    "독후감은 " + BookReport.MAX_CONTENT_LENGTH + "자 이하여야 합니다.");
        }
        return trimmed;
    }
}
