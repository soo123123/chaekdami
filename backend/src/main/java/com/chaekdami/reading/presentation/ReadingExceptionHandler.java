package com.chaekdami.reading.presentation;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// 도메인 규칙 위반을 HTTP 상태로 바꿔줌 (reading 패키지 컨트롤러에만 적용)
// 팀 공용 에러 형식(code, message)이 들어오면 공용 처리기로 옮길 예정
@RestControllerAdvice(basePackages = "com.chaekdami.reading")
public class ReadingExceptionHandler {

    public record ErrorResponse(String code, String message) {}

    // 도메인 규칙 위반 (페이지 범위 초과, 완독한 기록 수정, 메모 길이 등) → 400
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("VALIDATION_ERROR", e.getMessage()));
    }
}
