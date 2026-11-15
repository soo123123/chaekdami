package com.chaekdami.user.application;

import com.chaekdami.config.JwtTokenProvider;
import com.chaekdami.user.application.command.PasswordResetCommand;
import com.chaekdami.user.application.command.PasswordResetRequestCommand;
import com.chaekdami.user.application.command.SignupCommand;
import com.chaekdami.user.application.exception.ForbiddenException;
import com.chaekdami.user.application.exception.InvalidRequestException;
import com.chaekdami.user.application.result.UserAccount;
import com.chaekdami.user.domain.PasswordResetToken;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.PasswordResetTokenRepository;
import com.chaekdami.user.infrastructure.RefreshTokenRepository;
import com.chaekdami.user.infrastructure.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServicePasswordResetTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final PasswordResetTokenRepository passwordResetTokenRepository = mock(PasswordResetTokenRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final PasswordResetNotifier passwordResetNotifier = mock(PasswordResetNotifier.class);
    private UserService userService;
    private User user;

    @BeforeEach
    void setUp() {
        CurrentUser currentUser = new CurrentUser();
        userService = new UserService(
                userRepository,
                mock(RefreshTokenRepository.class),
                passwordResetTokenRepository,
                passwordEncoder,
                new JwtTokenProvider(Base64.getEncoder().encodeToString(new byte[32])),
                passwordResetNotifier,
                mock(LoginAttemptLimiter.class),
                currentUser,
                new AccessGuard(currentUser));
        user = User.builder()
                .email("reader@chaekdami.local")
                .passwordHash("stored-hash")
                .nickname("reader")
                .role(Role.USER)
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);
        when(passwordResetTokenRepository.findAllByUser_IdAndUsedAtIsNull(1L)).thenReturn(List.of());
        when(passwordResetTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void signupStoresANormalUserAndNormalizesEmail() {
        when(userRepository.findByEmail("reader@chaekdami.local")).thenReturn(Optional.empty());
        when(userRepository.existsByNicknameIgnoreCase("reader")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hash");
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserAccount account = userService.signup(new SignupCommand(" Reader@Chaekdami.local ", "password123", " reader "));

        assertEquals("reader@chaekdami.local", account.email());
        assertEquals("reader", account.nickname());
        assertEquals("USER", account.role());
    }

    @Test
    void missingEmailDoesNotRevealWhetherTheAccountExists() {
        when(userRepository.findByEmail("missing@chaekdami.local")).thenReturn(Optional.empty());

        userService.requestPasswordReset(new PasswordResetRequestCommand("missing@chaekdami.local", "127.0.0.1"));

        verify(passwordResetNotifier, never()).send(any(), any());
        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    void resetTokenWorksOnceAndInvalidatesExistingPasses() {
        when(userRepository.findByEmail("reader@chaekdami.local")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Newpassword1", "stored-hash")).thenReturn(false);
        when(passwordEncoder.encode("Newpassword1")).thenReturn("new-hash");
        userService.requestPasswordReset(new PasswordResetRequestCommand(" Reader@Chaekdami.local ", "127.0.0.1"));

        ArgumentCaptor<String> rawToken = ArgumentCaptor.forClass(String.class);
        verify(passwordResetNotifier).send(org.mockito.ArgumentMatchers.eq("reader@chaekdami.local"), rawToken.capture());
        ArgumentCaptor<PasswordResetToken> saved = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(saved.capture());
        when(passwordResetTokenRepository.findByTokenHash(saved.getValue().getTokenHash()))
                .thenReturn(Optional.of(saved.getValue()));

        userService.resetPassword(new PasswordResetCommand(rawToken.getValue(), "Newpassword1"));

        assertEquals(1L, user.getTokenVersion());
        assertEquals("new-hash", user.getPasswordHash());
        assertTrue(saved.getValue().isUsed());
        assertThrows(InvalidRequestException.class,
                () -> userService.resetPassword(new PasswordResetCommand(rawToken.getValue(), "Newpassword1")));
        assertEquals(1L, user.getTokenVersion());
    }

    @Test
    void expiredResetTokenDoesNotChangeThePassword() {
        PasswordResetToken expired = new PasswordResetToken(user, "hash", LocalDateTime.now().minusMinutes(1));
        when(passwordResetTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(expired));

        assertThrows(InvalidRequestException.class,
                () -> userService.resetPassword(new PasswordResetCommand("raw-token", "Newpassword1")));
        assertEquals(0L, user.getTokenVersion());
    }

    @Test
    void getMeRejectsAnotherUsersRecord() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                1L, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        ReflectionTestUtils.setField(user, "id", 2L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(ForbiddenException.class, () -> userService.getMe());
    }
}
