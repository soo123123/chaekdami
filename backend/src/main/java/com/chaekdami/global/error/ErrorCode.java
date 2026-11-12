package com.chaekdami.global.error;

/**
 * 도메인별 오류 코드 enum이 구현한다. Lombok {@code @Getter}로 code, status, message 필드를 두면 그대로 맞는다.
 */
public interface ErrorCode {

    String getCode();

    int getStatus();

    String getMessage();
}
