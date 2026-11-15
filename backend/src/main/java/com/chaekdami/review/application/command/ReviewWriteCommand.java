package com.chaekdami.review.application.command;

/**
 * null인 필드는 그대로 둔다. {@code oneLine}에 빈 문자열을 보내면 한줄평을 지운다.
 */
public record ReviewWriteCommand(Integer rating, String oneLine, Boolean isSpoiler, Boolean isPublic) {
}
