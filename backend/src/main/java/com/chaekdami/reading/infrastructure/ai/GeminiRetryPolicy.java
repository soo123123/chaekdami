package com.chaekdami.reading.infrastructure.ai;

import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;

import java.net.ConnectException;
import java.net.NoRouteToHostException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.time.Duration;

// Gemini 호출이 실패했을 때 다시 부를지 판단 (스펙 004 R4)
// - 연결 실패·서버 오류(5xx): 첫 호출 시작부터 4초 안에 실패했으면 1초 쉬고 한 번 더
// - 응답 시간 초과(30초): 다시 부르면 사용자가 너무 오래 기다려서 다시 시도하지 않음
// - 사용 한도 초과(429): 다시 시도하지 않고 "AI 확인 안 함"으로 처리 (임시 API라 통과로 판정)
// - 그 밖(4xx, 응답 해석 실패 등): 다시 시도하지 않음
final class GeminiRetryPolicy {

    enum Kind { RETRY, NO_RETRY, RATE_LIMITED }

    static final int MAX_ATTEMPTS = 2;                           // 첫 호출 + 다시 시도 1번
    static final Duration RETRY_DELAY = Duration.ofSeconds(1);   // 다시 부르기 전 쉬는 시간
    static final Duration RETRY_WITHIN = Duration.ofSeconds(4);  // 이 시간 안에 실패했을 때만 다시 시도 (전체 약 40초 안)

    private GeminiRetryPolicy() {}

    static Kind classify(Throwable e) {
        if (e instanceof HttpClientErrorException.TooManyRequests) {
            return Kind.RATE_LIMITED;
        }
        if (e instanceof HttpServerErrorException) {
            return Kind.RETRY;
        }
        if (e instanceof ResourceAccessException) {
            return isConnectionFailure(e) ? Kind.RETRY : Kind.NO_RETRY;
        }
        return Kind.NO_RETRY;
    }

    // 다시 시도 대상이고, 첫 호출 시작부터 RETRY_WITHIN 안에 실패했으면 true
    static boolean shouldRetry(Kind kind, long elapsedMillis) {
        return kind == Kind.RETRY && elapsedMillis <= RETRY_WITHIN.toMillis();
    }

    // 연결 단계의 실패인가 (응답을 기다리다 시간이 넘은 것은 아님)
    private static boolean isConnectionFailure(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause() == t ? null : t.getCause()) {
            if (t instanceof ConnectException || t instanceof UnknownHostException || t instanceof NoRouteToHostException) {
                return true;
            }
            if (t instanceof SocketTimeoutException) {
                // HttpURLConnection: 연결 시간 초과는 "connect timed out", 응답 시간 초과는 "Read timed out"
                String message = t.getMessage();
                return message != null && message.toLowerCase().contains("connect");
            }
        }
        return false;
    }
}
