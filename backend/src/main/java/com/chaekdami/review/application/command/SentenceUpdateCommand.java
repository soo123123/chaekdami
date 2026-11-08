package com.chaekdami.review.application.command;

/**
 * {@code pageNumberPresent}가 true이고 {@code pageNumber}가 null이면 쪽 번호를 지운다.
 */
public record SentenceUpdateCommand(String content, boolean pageNumberPresent, Integer pageNumber) {
}
