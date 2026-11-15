package com.chaekdami.user.application.exception;

import lombok.Getter;

@Getter
public class InvalidRequestException extends RuntimeException {

    private final String field;

    public InvalidRequestException(String field, String message) {
        super(message);
        this.field = field;
    }
}
