package com.chaekdami.review.application.port;

import java.time.LocalDateTime;

public record ReadingRecordView(Long readingRecordId, Long userId, Long bookId, int round,
                                String status, LocalDateTime startedAt, LocalDateTime completedAt) {

    public static final String COMPLETED = "COMPLETED";

    public boolean completed() {
        return COMPLETED.equals(status);
    }

    public boolean ownedBy(Long userId) {
        return this.userId.equals(userId);
    }
}
