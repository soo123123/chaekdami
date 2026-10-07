package com.chaekdami.user.application.exception;

public class EmailNotVerifiedException extends RuntimeException {

    public EmailNotVerifiedException() {
        super("이메일 인증이 필요합니다.");
    }
}
