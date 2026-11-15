package com.chaekdami.review.application.event;

public record ReviewCreatedEvent(Long userId, Long bookId, Long reviewId) {
}
