package com.chaekdami.user.application;

import com.chaekdami.user.application.exception.TooManyAttemptsException;
import com.chaekdami.user.domain.AuthAttempt;
import com.chaekdami.user.infrastructure.AuthAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LoginAttemptLimiter {

    static final int MAX_ATTEMPTS = 5;
    static final Duration WINDOW = Duration.ofMinutes(15);
    static final Duration LOCK = Duration.ofMinutes(15);

    private final AuthAttemptRepository authAttemptRepository;

    @Transactional(readOnly = true)
    public void checkLoginAllowed(String email, String clientIp) {
        ensureAllowed(loginKey(email, clientIp));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLoginFailure(String email, String clientIp) {
        increase(loginKey(email, clientIp));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void clearLoginFailures(String email, String clientIp) {
        authAttemptRepository.findByAttemptKey(loginKey(email, clientIp))
                .ifPresent(attempt -> attempt.clear(LocalDateTime.now()));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void consumePasswordResetRequest(String email, String clientIp) {
        String key = resetKey(email, clientIp);
        ensureAllowed(key);
        increase(key);
    }

    private void ensureAllowed(String key) {
        authAttemptRepository.findByAttemptKey(key)
                .filter(attempt -> attempt.isLocked(LocalDateTime.now()))
                .ifPresent(attempt -> {
                    throw new TooManyAttemptsException();
                });
    }

    private void increase(String key) {
        LocalDateTime now = LocalDateTime.now();
        AuthAttempt attempt = authAttemptRepository.findByAttemptKey(key)
                .orElseGet(() -> authAttemptRepository.save(new AuthAttempt(key, now)));
        attempt.increase(now, MAX_ATTEMPTS, WINDOW, LOCK);
    }

    private static String loginKey(String email, String clientIp) {
        return "login|" + email + "|" + clientIp;
    }

    private static String resetKey(String email, String clientIp) {
        return "reset|" + email + "|" + clientIp;
    }
}
