package com.chaekdami.review.application;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.port.UserNicknameReader;
import com.chaekdami.review.application.result.AdminReviewResult;
import com.chaekdami.review.application.result.CommunityAuthor;
import com.chaekdami.review.domain.Review;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.infrastructure.ReviewReportRepository;
import com.chaekdami.review.infrastructure.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * 관리자 권한은 SecurityConfig의 {@code /api/admin/**} 규칙이 확인한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewAdminService {

    private static final Sort MOST_REPORTED = Sort.by(Sort.Order.desc("reportCount"), Sort.Order.desc("id"));

    private final ReviewRepository reviewRepository;
    private final ReviewReportRepository reviewReportRepository;
    private final UserNicknameReader userNicknameReader;
    private final KoreanTime koreanTime;

    public PageResponse<AdminReviewResult> reported(Boolean blinded, int page, int size) {
        Page<Review> reviews = reviewRepository.findReported(blinded, Paging.of(page, size).withSort(MOST_REPORTED));
        Map<Long, Map<String, Long>> reasons = reasonsOf(reviews.getContent().stream().map(Review::getId).toList());
        Map<Long, String> nicknames = userNicknameReader.findNicknames(
                reviews.getContent().stream().map(Review::getUserId).distinct().toList());
        return PageResponse.from(reviews, review -> toResult(review,
                reasons.getOrDefault(review.getId(), Map.of()), nicknames.get(review.getUserId())));
    }

    /**
     * 블라인드를 풀면 신고 수를 0으로 되돌린다. 신고 기록은 남아 같은 사람이 다시 신고할 수 없다.
     */
    @Transactional
    public AdminReviewResult changeBlind(Long reviewId, boolean blinded) {
        reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.REVIEW_NOT_FOUND));
        if (blinded) {
            reviewRepository.blind(reviewId, koreanTime.now());
        } else {
            reviewRepository.unblind(reviewId);
        }
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.REVIEW_NOT_FOUND));
        return toResult(review, reasonsOf(List.of(reviewId)).getOrDefault(reviewId, Map.of()),
                userNicknameReader.findNicknames(List.of(review.getUserId())).get(review.getUserId()));
    }

    private Map<Long, Map<String, Long>> reasonsOf(Collection<Long> reviewIds) {
        if (reviewIds.isEmpty()) {
            return Map.of();
        }
        return reviewReportRepository.countReasons(reviewIds).stream()
                .collect(Collectors.groupingBy(ReviewReportRepository.ReasonCount::getReviewId,
                        Collectors.toMap(row -> row.getReason().name(), ReviewReportRepository.ReasonCount::getCount,
                                Long::sum, TreeMap::new)));
    }

    private static AdminReviewResult toResult(Review review, Map<String, Long> reasons, String nickname) {
        return new AdminReviewResult(review.getId(), new CommunityAuthor(review.getUserId(), nickname),
                review.getBookId(), review.getIsbn(), review.getRating(), review.getOneLine(), review.isSpoiler(),
                review.isPublic(), review.getReportCount(), review.isBlinded(), review.getBlindedAt(), reasons,
                review.getCreatedAt(), review.getUpdatedAt());
    }
}
