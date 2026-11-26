package com.chaekdami.review.application.result;

import java.time.LocalDateTime;
import java.util.Map;

public record AdminSentenceResult(Long sentenceId, CommunityAuthor author, Long readingRecordId, Long bookId,
                                  Integer pageNumber, String content, int reportCount, boolean isBlinded,
                                  LocalDateTime blindedAt, Map<String, Long> reportReasons,
                                  LocalDateTime createdAt, LocalDateTime updatedAt) {
}
