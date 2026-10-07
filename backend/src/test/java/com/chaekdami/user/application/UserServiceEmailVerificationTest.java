package com.chaekdami.user.application;

import com.chaekdami.config.JwtTokenProvider;
import com.chaekdami.user.application.command.EmailVerificationRequestCommand;
import com.chaekdami.user.application.command.LoginCommand;
import com.chaekdami.user.application.exception.EmailNotVerifiedException;
import com.chaekdami.user.application.exception.InvalidRequestException;
import com.chaekdami.user.domain.EmailVerificationToken;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.EmailVerificationTokenRepository;
import com.chaekdami.user.infrastructure.PasswordResetTokenRepository;
import com.chaekdami.user.infrastructure.RefreshTokenRepository;
import com.chaekdami.user.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserServiceEmailVerificationTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final EmailVerificationTokenRepository emailVerificationTokenRepository = mock(EmailVerificationTokenRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final EmailVerificationNotifier emailVerificationNotifier = mock(EmailVerificationNotifier.class);
    private UserService userService;
    private User user;

    @BeforeEach
    void setUp() {
        CurrentUser currentUser = new CurrentUser();
        userService = new UserService(
                userRepository,
                mock(RefreshTokenRepository.class),
                mock(PasswordResetTokenRepository.class),
                passwordEncoder,
                new JwtTokenProvider(Base64.getEncoder().encodeToString(new byte[32])),
                mock(PasswordResetNotifier.class),
                mock(LoginAttemptLimiter.class),
                currentUser,
                new AccessGuard(currentUser),
                emailVerificationTokenRepository,
                emailVerificationNotifier);
        user = User.builder()
                .email("reader@chaekdami.local")
                .passwordHash("stored-hash")
                .nickname("reader")
                .role(Role.USER)
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);
        when(userRepository.findByEmail("reader@chaekdami.local")).thenReturn(Optional.of(user));
        when(emailVerificationTokenRepository.findAllByUser_IdAndUsedAtIsNull(1L)).thenReturn(List.of());
        when(emailVerificationTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(passwordEncoder.matches("password123", "stored-hash")).thenReturn(true);
    }

    @Test
    void loginRequiresEmailVerification() {
        assertThrows(EmailNotVerifiedException.class,
                () -> userService.login(new LoginCommand("reader@chaekdami.local", "password123", "127.0.0.1")));
    }

    @Test
    void verificationTokenCanBeUsedOnce() {
        userService.requestEmailVerification(new EmailVerificationRequestCommand("reader@chaekdami.local", "127.0.0.1"));

        ArgumentCaptor<String> rawToken = ArgumentCaptor.forClass(String.class);
        verify(emailVerificationNotifier).send(eq("reader@chaekdami.local"), rawToken.capture());
        ArgumentCaptor<EmailVerificationToken> saved = ArgumentCaptor.forClass(EmailVerificationToken.class);
        verify(emailVerificationTokenRepository).save(saved.capture());
        when(emailVerificationTokenRepository.findByTokenHash(saved.getValue().getTokenHash()))
                .thenReturn(Optional.of(saved.getValue()));

        userService.verifyEmail(rawToken.getValue());

        assertTrue(user.isEmailVerified());
        assertTrue(saved.getValue().isUsed());
        assertThrows(InvalidRequestException.class, () -> userService.verifyEmail(rawToken.getValue()));
    }

    @Test
    void unknownEmailDoesNotSendVerificationMail() {
        when(userRepository.findByEmail("missing@chaekdami.local")).thenReturn(Optional.empty());

        userService.requestEmailVerification(new EmailVerificationRequestCommand("missing@chaekdami.local", "127.0.0.1"));

        verify(emailVerificationNotifier, never()).send(anyString(), anyString());
    }

    @Test
    void expiredVerificationTokenDoesNotVerifyTheUser() {
        EmailVerificationToken expired = new EmailVerificationToken(user, "hash", LocalDateTime.now().minusHours(1));
        when(emailVerificationTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(expired));

        assertThrows(InvalidRequestException.class, () -> userService.verifyEmail("raw-token"));
        assertEquals(false, user.isEmailVerified());
    }
}
