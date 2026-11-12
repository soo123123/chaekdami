package com.chaekdami.review.application.result;

import java.time.LocalDateTime;
import java.util.Map;

public record AdminReviewResult(Long reviewId, CommunityAuthor author, Long bookId, String isbn, int rating,
                                String oneLine, boolean isSpoiler, boolean isPublic, int reportCount,
                                boolean isBlinded, LocalDateTime blindedAt, Map<String, Long> reportReasons,
                                LocalDateTime createdAt, LocalDateTime updatedAt) {
}
