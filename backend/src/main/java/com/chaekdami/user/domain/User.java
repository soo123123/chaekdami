package com.chaekdami.user.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Locale;

@Entity
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

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

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

    public void verifyEmail() {
        this.emailVerified = true;
    }
}