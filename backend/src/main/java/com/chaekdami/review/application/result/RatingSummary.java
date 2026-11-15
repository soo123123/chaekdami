package com.chaekdami.review.application.result;

import java.util.Map;

/**
 * {@code distribution}의 키는 "1"부터 "5"까지 모두 들어 있다.
 */
public record RatingSummary(String isbn, double averageRating, long ratingCount, Map<String, Long> distribution) {
}
