package com.chaekdami.user.presentation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 공통 에러 응답. 값이 없는 칸은 응답에서 빠진다.
 * suspendedUntil은 ACCOUNT_SUSPENDED(정지 끝 시각이 있을 때)에만 채운다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(String code, String message, List<FieldError> fields, LocalDateTime suspendedUntil) {

    public ApiErrorResponse(String code, String message, List<FieldError> fields) {
        this(code, message, fields, null);
    }

    public static ApiErrorResponse of(String code, String message) {
        return new ApiErrorResponse(code, message, null);
    }

    public record FieldError(String field, String message) {
    }
}
