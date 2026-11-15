package com.chaekdami.user.application.exception;

public class TooManyAttemptsException extends RuntimeException {

    public TooManyAttemptsException() {
        super("시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.");
    }
}
