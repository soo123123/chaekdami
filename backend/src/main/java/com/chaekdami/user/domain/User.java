package com.chaekdami.user.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.DynamicUpdate;

import java.time.LocalDateTime;
import java.util.Locale;

/** 동시에 다른 컬럼을 고친 요청을 옛 값으로 덮어쓰지 않도록 바뀐 컬럼만 UPDATE한다. */
@Entity
@DynamicUpdate
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(name = "nickname_lower", unique = true, length = 16)
    private String nicknameLower;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "token_version", nullable = false)
    private long tokenVersion;

    // 정지 칸은 기존 행에 추가할 수 있게 NULL을 허용한다. status가 null이면 ACTIVE로 본다.
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private UserStatus status;

    @Column(name = "suspended_until")
    private LocalDateTime suspendedUntil;

    @Column(name = "suspension_reason", length = MAX_SUSPENSION_REASON_LENGTH)
    private String suspensionReason;

    @Column(name = "suspended_at")
    private LocalDateTime suspendedAt;

    @Column(name = "suspended_by")
    private Long suspendedBy;

    public static final int MAX_SUSPENSION_REASON_LENGTH = 200;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        syncNicknameKey();
    }

    @PreUpdate
    public void preUpdate() {
        syncNicknameKey();
    }

    private void syncNicknameKey() {
        if (this.nickname != null) {
            this.nicknameLower = this.nickname.toLowerCase(Locale.ROOT);
        }
    }

    @Builder
    public User(String email, String passwordHash, String nickname, Role role) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.nickname = nickname;
        this.role = role != null ? role : Role.USER;
    }

    public void changePassword(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void bumpTokenVersion() {
        this.tokenVersion++;
    }

    public void changeNickname(String nickname) {
        this.nickname = nickname;
    }

    public void changeRole(Role role) {
        this.role = role;
    }

    /** 이미 정지돼 있으면 사유·끝 시각·정지 시각·관리자를 새 값으로 바꾼다. until이 null이면 무기한. */
    public void suspend(String reason, LocalDateTime until, Long adminId, LocalDateTime now) {
        this.status = UserStatus.SUSPENDED;
        this.suspensionReason = reason;
        this.suspendedUntil = until;
        this.suspendedAt = now;
        this.suspendedBy = adminId;
    }

    public void unsuspend() {
        this.status = UserStatus.ACTIVE;
        this.suspensionReason = null;
        this.suspendedUntil = null;
        this.suspendedAt = null;
        this.suspendedBy = null;
    }

    /** 정지 상태이고 끝 시각이 없거나 아직 지나지 않았을 때만 정지다. 끝 시각이 지나면 따로 해제하지 않아도 풀린다. */
    public boolean isSuspendedAt(LocalDateTime now) {
        return status == UserStatus.SUSPENDED && (suspendedUntil == null || suspendedUntil.isAfter(now));
    }

    public UserStatus effectiveStatus(LocalDateTime now) {
        return isSuspendedAt(now) ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
    }
}