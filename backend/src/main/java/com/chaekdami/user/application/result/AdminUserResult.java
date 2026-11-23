package com.chaekdami.user.application.result;

import com.chaekdami.user.domain.User;

import java.time.LocalDateTime;

/**
 * 관리자용 회원 정보. 비밀번호 해시·토큰은 넣지 않는다.
 * status는 끝 시각이 지난 정지를 ACTIVE로 본 값이다. 정지 사유·시각·관리자는 상세에서만 채운다.
 */
public record AdminUserResult(Long id, String email, String nickname, String role, String status,
                              LocalDateTime suspendedUntil, LocalDateTime createdAt,
                              String suspensionReason, LocalDateTime suspendedAt, Long suspendedBy) {

    public static AdminUserResult summary(User user, LocalDateTime now) {
        boolean suspended = user.isSuspendedAt(now);
        return new AdminUserResult(user.getId(), user.getEmail(), user.getNickname(), user.getRole().name(),
                user.effectiveStatus(now).name(), suspended ? user.getSuspendedUntil() : null,
                user.getCreatedAt(), null, null, null);
    }

    public static AdminUserResult detail(User user, LocalDateTime now) {
        boolean suspended = user.isSuspendedAt(now);
        return new AdminUserResult(user.getId(), user.getEmail(), user.getNickname(), user.getRole().name(),
                user.effectiveStatus(now).name(), suspended ? user.getSuspendedUntil() : null,
                user.getCreatedAt(),
                suspended ? user.getSuspensionReason() : null,
                suspended ? user.getSuspendedAt() : null,
                suspended ? user.getSuspendedBy() : null);
    }
}
