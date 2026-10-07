package com.chaekdami.user.application;

import com.chaekdami.config.JwtTokenProvider;
import com.chaekdami.user.application.command.LoginCommand;
import com.chaekdami.user.application.exception.InvalidCredentialsException;
import com.chaekdami.user.application.exception.TooManyAttemptsException;
import com.chaekdami.user.domain.AuthAttempt;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.AuthAttemptRepository;
import com.chaekdami.user.infrastructure.PasswordResetTokenRepository;
import com.chaekdami.user.infrastructure.RefreshTokenRepository;
import com.chaekdami.user.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserServiceLoginAttemptTest {

    private UserService userService;

    @BeforeEach
    void setUp() {
        User user = User.builder()
                .email("reader@chaekdami.local")
                .passwordHash("stored-hash")
                .nickname("reader")
                .role(Role.USER)
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);

        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findByEmail("reader@chaekdami.local")).thenReturn(Optional.of(user));

        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
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
                mock(com.chaekdami.user.infrastructure.EmailVerificationTokenRepository.class),
                mock(EmailVerificationNotifier.class));
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
}
