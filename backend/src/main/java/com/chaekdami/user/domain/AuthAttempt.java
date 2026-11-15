package com.chaekdami.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.LocalDateTime;

@Entity
@Table(name = "auth_attempts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuthAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attempt_key", nullable = false, unique = true, length = 320)
    private String attemptKey;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(name = "window_started_at", nullable = false)
    private LocalDateTime windowStartedAt;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    public AuthAttempt(String attemptKey, LocalDateTime now) {
        this.attemptKey = attemptKey;
        this.attemptCount = 0;
        this.windowStartedAt = now;
    }

    public boolean isLocked(LocalDateTime now) {
        return lockedUntil != null && lockedUntil.isAfter(now);
    }

    public void increase(LocalDateTime now, int maxAttempts, Duration window, Duration lock) {
        boolean windowOver = !windowStartedAt.plus(window).isAfter(now);
        boolean lockOver = lockedUntil != null && !lockedUntil.isAfter(now);
        if (windowOver || lockOver) {
            attemptCount = 0;
            windowStartedAt = now;
            lockedUntil = null;
        }
        attemptCount++;
        if (attemptCount >= maxAttempts) {
            lockedUntil = now.plus(lock);
        }
    }

    public void clear(LocalDateTime now) {
        attemptCount = 0;
        windowStartedAt = now;
        lockedUntil = null;
    }
}
