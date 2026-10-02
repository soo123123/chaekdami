package com.chaekdami.user.application.exception;

public class InvalidCredentialsException extends RuntimeException {

    public static final String MESSAGE = "이메일 또는 비밀번호가 올바르지 않습니다.";

    public InvalidCredentialsException() {
        super(MESSAGE);
    }
}
