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
    static final int MAX_RESETS_PER_EMAIL = 10;
    static final Duration EMAIL_RESET_WINDOW = Duration.ofHours(1);
    static final Duration EMAIL_RESET_LOCK = Duration.ofHours(1);
    /** IP 자리에 넣어 이메일 전체의 기록을 뜻한다. */
    private static final String ANY_IP = "*";

    private final AuthAttemptRepository authAttemptRepository;

    @Transactional(readOnly = true)
    public void checkLoginAllowed(String email, String clientIp) {
        ensureAllowed(loginKey(email, clientIp));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLoginFailure(String email, String clientIp) {
        LocalDateTime now = LocalDateTime.now();
        lock(loginKey(email, clientIp), now).increase(now, MAX_ATTEMPTS, WINDOW, LOCK);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void clearLoginFailures(String email, String clientIp) {
        authAttemptRepository.findByAttemptKey(loginKey(email, clientIp))
                .ifPresent(attempt -> attempt.clear(LocalDateTime.now()));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void consumePasswordResetRequest(String email, String clientIp) {
        LocalDateTime now = LocalDateTime.now();
        AuthAttempt byIp = lock(resetKey(email, clientIp), now);
        ensureNotLocked(byIp, now);
        AuthAttempt byEmail = lock(resetKey(email, ANY_IP), now);
        ensureNotLocked(byEmail, now);
        byIp.increase(now, MAX_ATTEMPTS, WINDOW, LOCK);
        byEmail.increase(now, MAX_RESETS_PER_EMAIL, EMAIL_RESET_WINDOW, EMAIL_RESET_LOCK);
    }

    /** 회원 탈퇴와 같은 트랜잭션에서 그 이메일의 기록을 모든 IP에 대해 지운다. */
    @Transactional
    public void deleteAllOf(String email) {
        authAttemptRepository.deleteByKeyPrefix(loginKey(email, ""));
        authAttemptRepository.deleteByKeyPrefix(resetKey(email, ""));
    }

    private void ensureAllowed(String key) {
        authAttemptRepository.findByAttemptKey(key)
                .ifPresent(attempt -> ensureNotLocked(attempt, LocalDateTime.now()));
    }

    private static void ensureNotLocked(AuthAttempt attempt, LocalDateTime now) {
        if (attempt.isLocked(now)) {
            throw new TooManyAttemptsException();
        }
    }

    private AuthAttempt lock(String key, LocalDateTime now) {
        authAttemptRepository.insertIfAbsent(key, now);
        return authAttemptRepository.findByAttemptKeyForUpdate(key)
                .orElseThrow(() -> new IllegalStateException("요청 제한 기록을 찾을 수 없습니다."));
    }

    private static String loginKey(String email, String clientIp) {
        return "login|" + email + "|" + clientIp;
    }

    private static String resetKey(String email, String clientIp) {
        return "reset|" + email + "|" + clientIp;
    }
}
