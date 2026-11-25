package com.chaekdami.review.application;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.port.UserNicknameReader;
import com.chaekdami.review.application.result.AdminBookReportResult;
import com.chaekdami.review.application.result.AdminSentenceResult;
import com.chaekdami.review.application.result.CommunityAuthor;
import com.chaekdami.review.domain.BookReport;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.domain.Sentence;
import com.chaekdami.review.infrastructure.BookReportReportRepository;
import com.chaekdami.review.infrastructure.BookReportReportRepository.ReasonCount;
import com.chaekdami.review.infrastructure.BookReportRepository;
import com.chaekdami.review.infrastructure.SentenceReportRepository;
import com.chaekdami.review.infrastructure.SentenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * 관리자 권한은 SecurityConfig의 {@code /api/admin/**} 규칙이 확인한다.
 * 블라인드를 풀면 신고 수를 0으로 되돌린다. 신고 기록은 남아 같은 사람이 다시 신고할 수 없다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommunityAdminService {

    private static final Sort MOST_REPORTED = Sort.by(Sort.Order.desc("reportCount"), Sort.Order.desc("id"));

    private final BookReportRepository bookReportRepository;
    private final BookReportReportRepository bookReportReportRepository;
    private final SentenceRepository sentenceRepository;
    private final SentenceReportRepository sentenceReportRepository;
    private final UserNicknameReader userNicknameReader;
    private final KoreanTime koreanTime;

    public PageResponse<AdminBookReportResult> reportedBookReports(Boolean blinded, int page, int size) {
        Page<BookReport> reports = bookReportRepository.findReported(
                blinded, Paging.of(page, size).withSort(MOST_REPORTED));
        Map<Long, Map<String, Long>> reasons = bookReportReasons(
                reports.getContent().stream().map(BookReport::getId).toList());
        Map<Long, String> nicknames = nicknames(reports.getContent().stream().map(BookReport::getUserId).toList());
        return PageResponse.from(reports, report -> toResult(report, reasons, nicknames));
    }

    public PageResponse<AdminSentenceResult> reportedSentences(Boolean blinded, int page, int size) {
        Page<Sentence> sentences = sentenceRepository.findReported(
                blinded, Paging.of(page, size).withSort(MOST_REPORTED));
        Map<Long, Map<String, Long>> reasons = sentenceReasons(
                sentences.getContent().stream().map(Sentence::getId).toList());
        Map<Long, String> nicknames = nicknames(sentences.getContent().stream().map(Sentence::getUserId).toList());
        return PageResponse.from(sentences, sentence -> toResult(sentence, reasons, nicknames));
    }

    @Transactional
    public AdminBookReportResult changeBookReportBlind(Long bookReportId, boolean blinded) {
        requireBookReport(bookReportId);
        if (blinded) {
            bookReportRepository.blind(bookReportId, koreanTime.now());
        } else {
            bookReportRepository.unblind(bookReportId);
        }
        BookReport report = requireBookReport(bookReportId);
        return toResult(report, bookReportReasons(List.of(bookReportId)), nicknames(List.of(report.getUserId())));
    }

    @Transactional
    public AdminSentenceResult changeSentenceBlind(Long sentenceId, boolean blinded) {
        requireSentence(sentenceId);
        if (blinded) {
            sentenceRepository.blind(sentenceId, koreanTime.now());
        } else {
            sentenceRepository.unblind(sentenceId);
        }
        Sentence sentence = requireSentence(sentenceId);
        return toResult(sentence, sentenceReasons(List.of(sentenceId)), nicknames(List.of(sentence.getUserId())));
    }

    private BookReport requireBookReport(Long bookReportId) {
        return bookReportRepository.findById(bookReportId)
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.BOOK_REPORT_NOT_FOUND));
    }

    private Sentence requireSentence(Long sentenceId) {
        return sentenceRepository.findById(sentenceId)
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.SENTENCE_NOT_FOUND));
    }

    private Map<Long, String> nicknames(List<Long> userIds) {
        return userNicknameReader.findNicknames(userIds.stream().distinct().toList());
    }

    private Map<Long, Map<String, Long>> bookReportReasons(List<Long> ids) {
        return ids.isEmpty() ? Map.of() : group(bookReportReportRepository.countReasons(ids));
    }

    private Map<Long, Map<String, Long>> sentenceReasons(List<Long> ids) {
        return ids.isEmpty() ? Map.of() : group(sentenceReportRepository.countReasons(ids));
    }

    private static Map<Long, Map<String, Long>> group(List<ReasonCount> rows) {
        return rows.stream().collect(Collectors.groupingBy(ReasonCount::getTargetId,
                Collectors.toMap(row -> row.getReason().name(), ReasonCount::getCount, Long::sum, TreeMap::new)));
    }

    private static AdminBookReportResult toResult(BookReport report, Map<Long, Map<String, Long>> reasons,
                                                  Map<Long, String> nicknames) {
        return new AdminBookReportResult(report.getId(),
                new CommunityAuthor(report.getUserId(), nicknames.get(report.getUserId())),
                report.getReadingRecordId(), report.getBookId(), report.getContent(), report.isPublic(),
                report.getReportCount(), report.isBlinded(), report.getBlindedAt(),
                reasons.getOrDefault(report.getId(), Map.of()), report.getCreatedAt(), report.getUpdatedAt());
    }

    private static AdminSentenceResult toResult(Sentence sentence, Map<Long, Map<String, Long>> reasons,
                                                Map<Long, String> nicknames) {
        return new AdminSentenceResult(sentence.getId(),
                new CommunityAuthor(sentence.getUserId(), nicknames.get(sentence.getUserId())),
                sentence.getReadingRecordId(), sentence.getBookId(), sentence.getPageNumber(), sentence.getContent(),
                sentence.getReportCount(), sentence.isBlinded(), sentence.getBlindedAt(),
                reasons.getOrDefault(sentence.getId(), Map.of()), sentence.getCreatedAt(), sentence.getUpdatedAt());
    }
}
