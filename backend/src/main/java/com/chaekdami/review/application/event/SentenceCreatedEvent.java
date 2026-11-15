package com.chaekdami.review.application.event;

import java.time.LocalDate;

public record SentenceCreatedEvent(Long userId, Long readingRecordId, Long sentenceId, LocalDate readDate) {
}
