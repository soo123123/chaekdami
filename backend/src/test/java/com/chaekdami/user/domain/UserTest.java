package com.chaekdami.user.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UserTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 23, 12, 0);

    @Test
    void newUserStartsAtVersionZeroAndBumpIncreasesIt() {
        User user = user();

        assertEquals(0L, user.getTokenVersion());
        user.bumpTokenVersion();
        user.bumpTokenVersion();
        assertEquals(2L, user.getTokenVersion());
    }

    @Test
    void existingUserWithoutStatusIsActive() {
        User user = user();

        assertNull(user.getStatus());
        assertFalse(user.isSuspendedAt(NOW));
        assertEquals(UserStatus.ACTIVE, user.effectiveStatus(NOW));
    }

    @Test
    void suspensionWithoutEndLastsUntilLifted() {
        User user = user();

        user.suspend("운영 정책 위반", null, 9L, NOW);

        assertTrue(user.isSuspendedAt(NOW.plusYears(10)));
        assertEquals("운영 정책 위반", user.getSuspensionReason());
        assertEquals(NOW, user.getSuspendedAt());
        assertEquals(9L, user.getSuspendedBy());
    }

    @Test
    void suspensionEndsByItselfWhenUntilPasses() {
        User user = user();
        LocalDateTime until = NOW.plusDays(7);

        user.suspend(null, until, 9L, NOW);

        assertTrue(user.isSuspendedAt(until.minusSeconds(1)));
        assertFalse(user.isSuspendedAt(until));
        assertEquals(UserStatus.ACTIVE, user.effectiveStatus(until.plusDays(1)));
    }

    @Test
    void suspendingAgainReplacesReasonAndEnd() {
        User user = user();
        user.suspend("첫 사유", NOW.plusDays(1), 9L, NOW);

        user.suspend("새 사유", null, 10L, NOW.plusHours(1));

        assertEquals("새 사유", user.getSuspensionReason());
        assertNull(user.getSuspendedUntil());
        assertEquals(10L, user.getSuspendedBy());
    }

    @Test
    void unsuspendClearsSuspensionFields() {
        User user = user();
        user.suspend("사유", NOW.plusDays(1), 9L, NOW);

        user.unsuspend();

        assertEquals(UserStatus.ACTIVE, user.getStatus());
        assertFalse(user.isSuspendedAt(NOW));
        assertNull(user.getSuspensionReason());
        assertNull(user.getSuspendedUntil());
        assertNull(user.getSuspendedAt());
        assertNull(user.getSuspendedBy());
    }

    @Test
    void changeRoleUpdatesRole() {
        User user = user();

        user.changeRole(Role.ADMIN);

        assertEquals(Role.ADMIN, user.getRole());
    }

    private static User user() {
        return User.builder()
                .email("reader@chaekdami.local")
                .passwordHash("hash")
                .nickname("reader")
                .role(Role.USER)
                .build();
    }
}
