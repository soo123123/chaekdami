package com.chaekdami.user.application;

import com.chaekdami.user.application.exception.TooManyAttemptsException;
import com.chaekdami.user.domain.AuthAttempt;
import com.chaekdami.user.infrastructure.AuthAttemptRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LoginAttemptLimiterTest {

    private static final String EMAIL = "reader@chaekdami.local";
    private static final String IP = "127.0.0.1";

    private final Map<String, AuthAttempt> store = new HashMap<>();
    private LoginAttemptLimiter limiter;

    @BeforeEach
    void setUp() {
        AuthAttemptRepository repository = mock(AuthAttemptRepository.class);
        when(repository.findByAttemptKey(any())).thenAnswer(invocation ->
                Optional.ofNullable(store.get(invocation.getArgument(0))));
        when(repository.findByAttemptKeyForUpdate(any())).thenAnswer(invocation ->
                Optional.ofNullable(store.get(invocation.getArgument(0))));
        when(repository.insertIfAbsent(any(), any())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            return store.putIfAbsent(key, new AuthAttempt(key, invocation.getArgument(1))) == null ? 1 : 0;
        });
        limiter = new LoginAttemptLimiter(repository);
    }

    @Test
    void fifthLoginFailureLocksTheNextAttempt() {
        for (int i = 0; i < 4; i++) {
            limiter.recordLoginFailure(EMAIL, IP);
        }
        assertDoesNotThrow(() -> limiter.checkLoginAllowed(EMAIL, IP));

        limiter.recordLoginFailure(EMAIL, IP);
        assertThrows(TooManyAttemptsException.class, () -> limiter.checkLoginAllowed(EMAIL, IP));
    }

    @Test
    void successfulLoginClearsTheFailureCount() {
        limiter.recordLoginFailure(EMAIL, IP);
        limiter.recordLoginFailure(EMAIL, IP);
        limiter.clearLoginFailures(EMAIL, IP);

        for (int i = 0; i < 4; i++) {
            limiter.recordLoginFailure(EMAIL, IP);
        }
        assertDoesNotThrow(() -> limiter.checkLoginAllowed(EMAIL, IP));
    }

    @Test
    void passwordResetRequestsAreLimitedSeparatelyFromLogin() {
        for (int i = 0; i < 5; i++) {
            limiter.recordLoginFailure(EMAIL, IP);
        }
        assertDoesNotThrow(() -> limiter.consumePasswordResetRequest(EMAIL, IP));

        for (int i = 0; i < 4; i++) {
            limiter.consumePasswordResetRequest(EMAIL, IP);
        }
        assertThrows(TooManyAttemptsException.class, () -> limiter.consumePasswordResetRequest(EMAIL, IP));
    }
}
