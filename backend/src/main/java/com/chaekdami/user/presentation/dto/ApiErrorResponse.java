package com.chaekdami.user.presentation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(String code, String message, List<FieldError> fields) {

    public static ApiErrorResponse of(String code, String message) {
        return new ApiErrorResponse(code, message, null);
    }

    public record FieldError(String field, String message) {
    }
}
