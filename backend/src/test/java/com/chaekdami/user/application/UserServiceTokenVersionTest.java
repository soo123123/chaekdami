package com.chaekdami.user.application;

import com.chaekdami.config.JwtTokenProvider;
import com.chaekdami.user.application.command.ChangePasswordCommand;
import com.chaekdami.user.application.exception.UnauthorizedException;
import com.chaekdami.user.domain.RefreshToken;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.PasswordResetTokenRepository;
import com.chaekdami.user.infrastructure.RefreshTokenRepository;
import com.chaekdami.user.infrastructure.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserServiceTokenVersionTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final RefreshTokenRepository refreshTokenRepository = mock(RefreshTokenRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private UserService userService;
    private User user;

    @BeforeEach
    void setUp() {
        String secret = Base64.getEncoder().encodeToString(new byte[32]);
        CurrentUser currentUser = new CurrentUser();
        userService = new UserService(
                userRepository,
                refreshTokenRepository,
                mock(PasswordResetTokenRepository.class),
                passwordEncoder,
                new JwtTokenProvider(secret),
                mock(PasswordResetNotifier.class),
                mock(LoginAttemptLimiter.class),
                currentUser,
                new AccessGuard(currentUser));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                1L, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        user = User.builder()
                .email("reader@chaekdami.local")
                .passwordHash("stored-hash")
                .nickname("reader")
                .role(Role.USER)
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void passwordChangeBumpsVersion() {
        when(passwordEncoder.matches("current-password", "stored-hash")).thenReturn(true);
        when(passwordEncoder.matches("new-password", "stored-hash")).thenReturn(false);
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");

        userService.changePassword(new ChangePasswordCommand("current-password", "new-password"));

        assertEquals(1L, user.getTokenVersion());
        assertEquals("new-hash", user.getPasswordHash());
    }

    @Test
    void logoutAllBumpsVersionAndSingleLogoutDoesNot() {
        userService.logoutAll();
        assertEquals(1L, user.getTokenVersion());

        String raw = "refresh-token";
        RefreshToken stored = new RefreshToken(user, sha256(raw), LocalDateTime.now().plusDays(1));
        when(refreshTokenRepository.findByTokenHash(sha256(raw))).thenReturn(Optional.of(stored));

        userService.logout(raw);

        assertEquals(1L, user.getTokenVersion());
    }

    @Test
    void reusedRefreshTokenBumpsVersion() {
        String raw = "stolen-refresh";
        RefreshToken stored = new RefreshToken(user, sha256(raw), LocalDateTime.now().plusDays(1));
        stored.revoke(LocalDateTime.now());
        when(refreshTokenRepository.findByTokenHash(sha256(raw))).thenReturn(Optional.of(stored));

        assertThrows(UnauthorizedException.class, () -> userService.refresh(raw));
        assertEquals(1L, user.getTokenVersion());
    }

    private static String sha256(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
