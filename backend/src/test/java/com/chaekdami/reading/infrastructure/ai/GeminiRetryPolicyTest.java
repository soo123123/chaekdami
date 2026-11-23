package com.chaekdami.reading.infrastructure.ai;

import com.chaekdami.reading.infrastructure.ai.GeminiRetryPolicy.Kind;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class GeminiRetryPolicyTest {

    private static HttpClientErrorException clientError(HttpStatus status) {
        return HttpClientErrorException.create(status, status.getReasonPhrase(), HttpHeaders.EMPTY, new byte[0], StandardCharsets.UTF_8);
    }

    private static HttpServerErrorException serverError(HttpStatus status) {
        return HttpServerErrorException.create(status, status.getReasonPhrase(), HttpHeaders.EMPTY, new byte[0], StandardCharsets.UTF_8);
    }

    private static ResourceAccessException io(Throwable cause) {
        return new ResourceAccessException("I/O error on POST request", new java.io.IOException(cause.getMessage(), cause));
    }

    @Test
    void 사용_한도_초과_429는_AI_확인_안_함() {
        assertThat(GeminiRetryPolicy.classify(clientError(HttpStatus.TOO_MANY_REQUESTS))).isEqualTo(Kind.RATE_LIMITED);
    }

    @Test
    void 서버_오류_5xx는_다시_시도_대상() {
        assertThat(GeminiRetryPolicy.classify(serverError(HttpStatus.INTERNAL_SERVER_ERROR))).isEqualTo(Kind.RETRY);
        assertThat(GeminiRetryPolicy.classify(serverError(HttpStatus.SERVICE_UNAVAILABLE))).isEqualTo(Kind.RETRY);
    }

    @Test
    void 연결_실패는_다시_시도_대상() {
        assertThat(GeminiRetryPolicy.classify(io(new ConnectException("Connection refused")))).isEqualTo(Kind.RETRY);
        assertThat(GeminiRetryPolicy.classify(io(new UnknownHostException("generativelanguage.googleapis.com")))).isEqualTo(Kind.RETRY);
        assertThat(GeminiRetryPolicy.classify(io(new SocketTimeoutException("Connect timed out")))).isEqualTo(Kind.RETRY);
    }

    @Test
    void 응답_시간_초과는_다시_시도하지_않음() {
        assertThat(GeminiRetryPolicy.classify(io(new SocketTimeoutException("Read timed out")))).isEqualTo(Kind.NO_RETRY);
    }

    @Test
    void 그_밖의_실패는_다시_시도하지_않음() {
        assertThat(GeminiRetryPolicy.classify(clientError(HttpStatus.BAD_REQUEST))).isEqualTo(Kind.NO_RETRY);
        assertThat(GeminiRetryPolicy.classify(clientError(HttpStatus.FORBIDDEN))).isEqualTo(Kind.NO_RETRY);
        assertThat(GeminiRetryPolicy.classify(new IllegalStateException("응답 해석 실패"))).isEqualTo(Kind.NO_RETRY);
    }

    @Test
    void 첫_실패가_4초_안이면_다시_시도() {
        assertThat(GeminiRetryPolicy.shouldRetry(Kind.RETRY, 0)).isTrue();
        assertThat(GeminiRetryPolicy.shouldRetry(Kind.RETRY, 4_000)).isTrue();
    }

    @Test
    void 첫_실패가_4초를_넘으면_다시_시도하지_않음() {
        assertThat(GeminiRetryPolicy.shouldRetry(Kind.RETRY, 4_001)).isFalse();
        assertThat(GeminiRetryPolicy.shouldRetry(Kind.RETRY, 10_000)).isFalse();
    }

    @Test
    void 다시_시도_대상이_아니면_시간과_상관없이_다시_시도하지_않음() {
        assertThat(GeminiRetryPolicy.shouldRetry(Kind.NO_RETRY, 0)).isFalse();
        assertThat(GeminiRetryPolicy.shouldRetry(Kind.RATE_LIMITED, 0)).isFalse();
    }

    @Test
    void 호출은_최대_2번_쉬는_시간은_1초() {
        assertThat(GeminiRetryPolicy.MAX_ATTEMPTS).isEqualTo(2);
        assertThat(GeminiRetryPolicy.RETRY_DELAY.toMillis()).isEqualTo(1_000);
    }
}
