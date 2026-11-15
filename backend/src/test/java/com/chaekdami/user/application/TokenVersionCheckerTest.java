package com.chaekdami.user.application;

import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TokenVersionCheckerTest {

    @Test
    void matchesOnlyTheVersionStoredForThatUser() {
        User user = User.builder()
                .email("reader@chaekdami.local")
                .passwordHash("hash")
                .nickname("reader")
                .role(Role.USER)
                .build();
        user.bumpTokenVersion();

        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        TokenVersionChecker checker = new TokenVersionChecker(userRepository);

        assertTrue(checker.matches(1L, 1L));
        assertFalse(checker.matches(1L, 0L));
        assertFalse(checker.matches(2L, 1L));
    }
}
