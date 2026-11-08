package com.chaekdami.review.presentation.dto;

import com.chaekdami.review.application.result.ReviewResult;

import java.time.LocalDateTime;

public record ReviewResponse(Long reviewId, Long bookId, int rating, String oneLine, boolean isSpoiler,
                             boolean isPublic, boolean isBlinded, int likeCount,
                             LocalDateTime createdAt, LocalDateTime updatedAt) {

    public static ReviewResponse from(ReviewResult result) {
        if (result == null) {
            return null;
        }
        return new ReviewResponse(result.reviewId(), result.bookId(), result.rating(), result.oneLine(),
                result.isSpoiler(), result.isPublic(), result.isBlinded(), result.likeCount(),
                result.createdAt(), result.updatedAt());
    }
}
