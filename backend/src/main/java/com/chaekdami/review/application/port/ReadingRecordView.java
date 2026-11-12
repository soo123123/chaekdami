package com.chaekdami.review.application.port;

import java.time.LocalDateTime;

/**
 * {@code isPublic}은 BE1 회차의 공개 여부이고, 독후활동에서는 그 회차 문장 모음집의 커뮤니티 공개 여부로 쓴다.
 */
public record ReadingRecordView(Long readingRecordId, Long userId, Long bookId, int round,
                                String status, boolean isPublic,
                                LocalDateTime startedAt, LocalDateTime completedAt) {

    public static final String COMPLETED = "COMPLETED";

    public boolean completed() {
        return COMPLETED.equals(status);
    }

    public boolean ownedBy(Long userId) {
        return this.userId.equals(userId);
    }
}
