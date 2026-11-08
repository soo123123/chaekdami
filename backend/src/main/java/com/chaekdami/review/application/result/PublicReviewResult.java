package com.chaekdami.review.application.result;

import java.time.LocalDateTime;

public record PublicReviewResult(Long reviewId, int rating, String oneLine, boolean isSpoiler, int likeCount,
                                 boolean isLiked, boolean isMine, CommunityAuthor author,
                                 LocalDateTime createdAt, LocalDateTime updatedAt) {
}
