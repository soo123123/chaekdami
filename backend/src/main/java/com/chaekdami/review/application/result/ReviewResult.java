package com.chaekdami.review.application.result;

import com.chaekdami.review.domain.Review;

import java.time.LocalDateTime;

public record ReviewResult(Long reviewId, Long bookId, int rating, String oneLine, boolean isSpoiler,
                           boolean isPublic, boolean isBlinded, int likeCount,
                           LocalDateTime createdAt, LocalDateTime updatedAt) {

    public static ReviewResult from(Review review) {
        return new ReviewResult(review.getId(), review.getBookId(), review.getRating(), review.getOneLine(),
                review.isSpoiler(), review.isPublic(), review.isBlinded(), review.getLikeCount(),
                review.getCreatedAt(), review.getUpdatedAt());
    }
}
