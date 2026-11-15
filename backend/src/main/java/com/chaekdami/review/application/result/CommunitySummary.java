package com.chaekdami.review.application.result;

/**
 * {@code completerCount}는 사람 수, 공개 모음집·독후감 수는 회차 수다.
 * {@code lockReason}은 {@code NOT_COMPLETED}, {@code NO_ISBN}, null 중 하나다.
 */
public record CommunitySummary(Long bookId, String isbn, boolean available, boolean unlocked, String lockReason,
                               long completerCount, long publicCollectionCount, long publicBookReportCount) {
}
