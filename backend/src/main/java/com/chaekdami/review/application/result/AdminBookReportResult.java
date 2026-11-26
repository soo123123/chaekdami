package com.chaekdami.review.application.result;

import java.time.LocalDateTime;
import java.util.Map;

public record AdminBookReportResult(Long bookReportId, CommunityAuthor author, Long readingRecordId, Long bookId,
                                    String content, boolean isPublic, int reportCount, boolean isBlinded,
                                    LocalDateTime blindedAt, Map<String, Long> reportReasons,
                                    LocalDateTime createdAt, LocalDateTime updatedAt) {
}
