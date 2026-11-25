package com.chaekdami.review.application;

import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.command.ReviewReportCommand;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.infrastructure.BookReportReportRepository;
import com.chaekdami.review.infrastructure.BookReportRepository;
import com.chaekdami.review.infrastructure.CommunityQueryRepository;
import com.chaekdami.review.infrastructure.SentenceReportRepository;
import com.chaekdami.review.infrastructure.SentenceRepository;
import com.chaekdami.user.application.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/** 커뮤니티에서 볼 수 있는 독후감과 문장만 신고한다. 볼 수 없는 글은 있는지 드러내지 않고 404로 답한다. */
@Service
@RequiredArgsConstructor
public class CommunityReportService {

    private final CommunityQueryRepository communityQueryRepository;
    private final BookReportRepository bookReportRepository;
    private final BookReportReportRepository bookReportReportRepository;
    private final SentenceRepository sentenceRepository;
    private final SentenceReportRepository sentenceReportRepository;
    private final ReportQuota reportQuota;
    private final CurrentUser currentUser;

    @Value("${review.blind-threshold:3}")
    private int blindThreshold;

    @Transactional
    public void reportBookReport(Long bookReportId, ReviewReportCommand command) {
        Long userId = currentUser.requireId();
        ReportRules.validate(command);
        Long authorId = communityQueryRepository.findVisibleBookReportAuthor(bookReportId, userId)
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.BOOK_REPORT_NOT_FOUND));
        rejectOwn(authorId, userId);
        LocalDateTime reportedAt = reportQuota.save(userId, now -> bookReportReportRepository.insertIfAbsent(
                bookReportId, userId, command.reason().name(), ReportRules.detailOf(command), now));
        bookReportRepository.addReport(bookReportId, blindThreshold, reportedAt);
    }

    @Transactional
    public void reportSentence(Long sentenceId, ReviewReportCommand command) {
        Long userId = currentUser.requireId();
        ReportRules.validate(command);
        Long authorId = communityQueryRepository.findVisibleSentenceAuthor(sentenceId, userId)
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.SENTENCE_NOT_FOUND));
        rejectOwn(authorId, userId);
        LocalDateTime reportedAt = reportQuota.save(userId, now -> sentenceReportRepository.insertIfAbsent(
                sentenceId, userId, command.reason().name(), ReportRules.detailOf(command), now));
        sentenceRepository.addReport(sentenceId, blindThreshold, reportedAt);
    }

    private static void rejectOwn(Long authorId, Long userId) {
        if (authorId.equals(userId)) {
            throw new BusinessException(ReviewErrorCode.CANNOT_REPORT_OWN_CONTENT);
        }
    }
}
