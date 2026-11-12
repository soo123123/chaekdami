package com.chaekdami.review.application;

import com.chaekdami.global.dto.PageResponse;
import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.command.ReviewReportCommand;
import com.chaekdami.review.application.port.UserNicknameReader;
import com.chaekdami.review.application.result.CommunityAuthor;
import com.chaekdami.review.application.result.LikeResult;
import com.chaekdami.review.application.result.PublicReviewResult;
import com.chaekdami.review.application.result.RatingSummary;
import com.chaekdami.review.domain.ReportReason;
import com.chaekdami.review.domain.Review;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.domain.ReviewReport;
import com.chaekdami.review.infrastructure.ReviewLikeRepository;
import com.chaekdami.review.infrastructure.ReviewReportRepository;
import com.chaekdami.review.infrastructure.ReviewRepository;
import com.chaekdami.user.application.CurrentUser;
import com.chaekdami.user.application.exception.InvalidRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 한줄평 목록과 별점 통계는 완독 여부와 관계없이 ISBN만 있으면 본다. 책을 검색한 사용자도 쓴다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewSocialService {

    private static final Sort LATEST = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
    private static final Sort LIKES = Sort.by(Sort.Order.desc("likeCount"), Sort.Order.desc("createdAt"),
            Sort.Order.desc("id"));

    private final ReviewRepository reviewRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final ReviewReportRepository reviewReportRepository;
    private final UserNicknameReader userNicknameReader;
    private final CurrentUser currentUser;
    private final KoreanTime koreanTime;

    @Value("${review.blind-threshold:3}")
    private int blindThreshold;

    public PageResponse<PublicReviewResult> publicReviews(String isbn, String sort, int page, int size) {
        Long userId = currentUser.requireId();
        PageRequest pageable = Paging.of(page, size).withSort(sortOf(sort));
        Page<Review> reviews = reviewRepository.findPublicByIsbn(normalizeIsbn(isbn), pageable);

        List<Long> reviewIds = reviews.getContent().stream().map(Review::getId).toList();
        Set<Long> liked = reviewIds.isEmpty() ? Set.of()
                : new HashSet<>(reviewLikeRepository.findLikedReviewIds(userId, reviewIds));
        Map<Long, String> nicknames = userNicknameReader.findNicknames(
                reviews.getContent().stream().map(Review::getUserId).distinct().toList());

        return PageResponse.from(reviews, review -> new PublicReviewResult(
                review.getId(), review.getRating(), review.getOneLine(), review.isSpoiler(), review.getLikeCount(),
                liked.contains(review.getId()), review.ownedBy(userId),
                new CommunityAuthor(review.getUserId(), nicknames.get(review.getUserId())),
                review.getCreatedAt(), review.getUpdatedAt()));
    }

    /**
     * 비공개 리뷰의 별점도 익명으로 포함하고, 블라인드된 리뷰만 뺀다.
     */
    public RatingSummary ratingSummary(String isbn) {
        currentUser.requireId();
        String normalized = normalizeIsbn(isbn);
        Map<String, Long> distribution = new LinkedHashMap<>();
        for (int rating = Review.MIN_RATING; rating <= Review.MAX_RATING; rating++) {
            distribution.put(String.valueOf(rating), 0L);
        }
        long count = 0;
        long sum = 0;
        for (ReviewRepository.RatingCount row : reviewRepository.countRatingsByIsbn(normalized)) {
            distribution.put(String.valueOf(row.getRating()), row.getCount());
            count += row.getCount();
            sum += (long) row.getRating() * row.getCount();
        }
        double average = count == 0 ? 0.0
                : BigDecimal.valueOf(sum).divide(BigDecimal.valueOf(count), 1, RoundingMode.HALF_UP).doubleValue();
        return new RatingSummary(normalized, average, count, distribution);
    }

    @Transactional
    public LikeResult like(Long reviewId) {
        Long userId = currentUser.requireId();
        Review review = requireVisible(reviewId);
        if (review.ownedBy(userId)) {
            throw new BusinessException(ReviewErrorCode.CANNOT_LIKE_OWN_REVIEW);
        }
        if (reviewLikeRepository.insertIfAbsent(reviewId, userId, koreanTime.now()) == 1) {
            reviewRepository.incrementLikeCount(reviewId);
        }
        return new LikeResult(reviewId, true, reviewRepository.findLikeCount(reviewId));
    }

    @Transactional
    public LikeResult unlike(Long reviewId) {
        Long userId = currentUser.requireId();
        reviewRepository.findById(reviewId)
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.REVIEW_NOT_FOUND));
        if (reviewLikeRepository.deleteByReviewIdAndUserId(reviewId, userId) == 1) {
            reviewRepository.decrementLikeCount(reviewId);
        }
        return new LikeResult(reviewId, false, reviewRepository.findLikeCount(reviewId));
    }

    @Transactional
    public void report(Long reviewId, ReviewReportCommand command) {
        Long userId = currentUser.requireId();
        validateReport(command);
        Review review = requireVisible(reviewId);
        if (review.ownedBy(userId)) {
            throw new BusinessException(ReviewErrorCode.CANNOT_REPORT_OWN_REVIEW);
        }
        String detail = command.detail() == null || command.detail().isBlank() ? null : command.detail().strip();
        int inserted = reviewReportRepository.insertIfAbsent(
                reviewId, userId, command.reason().name(), detail, koreanTime.now());
        if (inserted == 0) {
            throw new BusinessException(ReviewErrorCode.ALREADY_REPORTED);
        }
        reviewRepository.addReport(reviewId, blindThreshold, koreanTime.now());
    }

    private Review requireVisible(Long reviewId) {
        return reviewRepository.findById(reviewId)
                .filter(Review::publiclyVisible)
                .orElseThrow(() -> new BusinessException(ReviewErrorCode.REVIEW_NOT_FOUND));
    }

    private static void validateReport(ReviewReportCommand command) {
        if (command.reason() == null) {
            throw new InvalidRequestException("reason", "신고 사유를 선택해야 합니다.");
        }
        boolean blankDetail = command.detail() == null || command.detail().isBlank();
        if (command.reason() == ReportReason.OTHER && blankDetail) {
            throw new InvalidRequestException("detail", "기타 사유는 내용을 입력해야 합니다.");
        }
        if (!blankDetail && command.detail().strip().length() > ReviewReport.MAX_DETAIL_LENGTH) {
            throw new InvalidRequestException("detail",
                    "신고 내용은 " + ReviewReport.MAX_DETAIL_LENGTH + "자 이하여야 합니다.");
        }
    }

    private static Sort sortOf(String sort) {
        if (sort == null || sort.equals("latest")) {
            return LATEST;
        }
        if (sort.equals("likes")) {
            return LIKES;
        }
        throw new InvalidRequestException("sort", "sort는 latest 또는 likes여야 합니다.");
    }

    /**
     * BE1 {@code BookService.normalizeIsbn}과 같은 규칙이어야 저장된 books.isbn과 맞는다.
     */
    static String normalizeIsbn(String isbn) {
        String normalized = isbn == null ? "" : isbn.replaceAll("[^0-9Xx]", "").toUpperCase(Locale.ROOT);
        if (normalized.isEmpty()) {
            throw new InvalidRequestException("isbn", "ISBN을 입력해야 합니다.");
        }
        return normalized;
    }
}
