package com.chaekdami.user.application;

import com.chaekdami.config.JwtTokenProvider;
import com.chaekdami.user.application.command.LoginCommand;
import com.chaekdami.user.application.exception.AccountSuspendedException;
import com.chaekdami.user.application.exception.InvalidCredentialsException;
import com.chaekdami.user.application.exception.TooManyAttemptsException;
import com.chaekdami.user.application.result.IssuedTokens;
import com.chaekdami.user.domain.AuthAttempt;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.domain.UserErrorCode;
import com.chaekdami.user.infrastructure.AuthAttemptRepository;
import com.chaekdami.user.infrastructure.LoginCredential;
import com.chaekdami.user.infrastructure.PasswordResetTokenRepository;
import com.chaekdami.user.infrastructure.RefreshTokenRepository;
import com.chaekdami.user.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionOperations;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserServiceLoginAttemptTest {

    private UserService userService;
    private User user;
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email("reader@chaekdami.local")
                .passwordHash("stored-hash")
                .nickname("reader")
                .role(Role.USER)
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);

        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findLoginCredential("reader@chaekdami.local"))
                .thenReturn(Optional.of(new LoginCredential(1L, "stored-hash")));
        when(userRepository.findByIdForLogin(1L)).thenReturn(Optional.of(user));

        passwordEncoder = mock(PasswordEncoder.class);
        when(passwordEncoder.matches(any(), any())).thenReturn(false);

        Map<String, AuthAttempt> store = new HashMap<>();
        AuthAttemptRepository authAttemptRepository = mock(AuthAttemptRepository.class);
        when(authAttemptRepository.findByAttemptKey(any())).thenAnswer(invocation ->
                Optional.ofNullable(store.get(invocation.getArgument(0))));
        when(authAttemptRepository.save(any())).thenAnswer(invocation -> {
            AuthAttempt attempt = invocation.getArgument(0);
            store.put(attempt.getAttemptKey(), attempt);
            return attempt;
        });

        CurrentUser currentUser = new CurrentUser();
        userService = new UserService(
                userRepository,
                mock(RefreshTokenRepository.class),
                mock(PasswordResetTokenRepository.class),
                passwordEncoder,
                new JwtTokenProvider(Base64.getEncoder().encodeToString(new byte[32])),
                mock(PasswordResetNotifier.class),
                new LoginAttemptLimiter(authAttemptRepository),
                currentUser,
                new AccessGuard(currentUser),
                mock(ApplicationEventPublisher.class),
                TransactionOperations.withoutTransaction());
    }

    @Test
    void fifthWrongPasswordIsRejectedUntilTheLockExpires() {
        LoginCommand command = new LoginCommand("Reader@Chaekdami.local", "wrong-password", "127.0.0.1");

        for (int i = 0; i < 4; i++) {
            assertThrows(InvalidCredentialsException.class, () -> userService.login(command));
        }
        assertThrows(TooManyAttemptsException.class, () -> userService.login(command));
        assertThrows(TooManyAttemptsException.class, () -> userService.login(command));
    }

    @Test
    void suspendedUserWithCorrectPasswordIsToldUntilWhen() {
        LocalDateTime until = LocalDateTime.now().plusDays(3);
        user.suspend("신고 누적", until, 9L, LocalDateTime.now());
        when(passwordEncoder.matches("right-password", "stored-hash")).thenReturn(true);

        AccountSuspendedException exception = assertThrows(AccountSuspendedException.class,
                () -> userService.login(new LoginCommand("reader@chaekdami.local", "right-password", "127.0.0.1")));

        assertEquals(UserErrorCode.ACCOUNT_SUSPENDED, exception.getErrorCode());
        assertEquals(until, exception.getSuspendedUntil());
    }

    @Test
    void suspendedUserWithWrongPasswordLooksLikeAnyWrongPassword() {
        user.suspend("신고 누적", null, 9L, LocalDateTime.now());

        assertThrows(InvalidCredentialsException.class,
                () -> userService.login(new LoginCommand("reader@chaekdami.local", "wrong-password", "127.0.0.1")));
    }

    @Test
    void expiredSuspensionDoesNotBlockLogin() {
        user.suspend("신고 누적", LocalDateTime.now().plusDays(1), 9L, LocalDateTime.now().minusDays(2));
        ReflectionTestUtils.setField(user, "suspendedUntil", LocalDateTime.now().minusSeconds(1));
        when(passwordEncoder.matches("right-password", "stored-hash")).thenReturn(true);

        IssuedTokens tokens = userService.login(
                new LoginCommand("reader@chaekdami.local", "right-password", "127.0.0.1"));

        assertNotNull(tokens.accessToken());
    }
}
