package com.chaekdami.review.application;

import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.port.UserLock;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.infrastructure.BookReportReportRepository;
import com.chaekdami.review.infrastructure.ReviewReportRepository;
import com.chaekdami.review.infrastructure.SentenceReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.function.ToIntFunction;

/** 한줄평·독후감·문장 신고를 합쳐 회원별 하루 횟수를 제한한다. 트랜잭션 안에서만 부른다. */
@Component
@RequiredArgsConstructor
class ReportQuota {

    static final int MAX_REPORTS_PER_DAY = 20;

    private final UserLock userLock;
    private final ReviewReportRepository reviewReportRepository;
    private final BookReportReportRepository bookReportReportRepository;
    private final SentenceReportRepository sentenceReportRepository;
    private final KoreanTime koreanTime;

    /**
     * 신고를 저장하고 저장한 시각을 돌려준다. 거절하면 예외로 저장까지 되돌린다.
     *
     * @param insert 저장한 행 수. 0이면 이미 신고한 글이다
     */
    LocalDateTime save(Long userId, ToIntFunction<LocalDateTime> insert) {
        // 같은 회원의 신고가 겹쳐도 하루 횟수를 넘지 않게 한다.
        userLock.lock(userId);
        LocalDateTime now = koreanTime.now();
        if (insert.applyAsInt(now) == 0) {
            throw new BusinessException(ReviewErrorCode.ALREADY_REPORTED);
        }
        LocalDateTime today = now.toLocalDate().atStartOfDay();
        long count = reviewReportRepository.countByUserIdAndCreatedAtGreaterThanEqual(userId, today)
                + bookReportReportRepository.countByUserIdAndCreatedAtGreaterThanEqual(userId, today)
                + sentenceReportRepository.countByUserIdAndCreatedAtGreaterThanEqual(userId, today);
        if (count > MAX_REPORTS_PER_DAY) {
            throw new BusinessException(ReviewErrorCode.TOO_MANY_ATTEMPTS);
        }
        return now;
    }
}
