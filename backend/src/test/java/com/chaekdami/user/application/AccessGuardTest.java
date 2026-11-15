package com.chaekdami.user.application;

import com.chaekdami.user.application.exception.ForbiddenException;
import com.chaekdami.user.application.exception.UnauthorizedException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AccessGuardTest {

    private final AccessGuard accessGuard = new AccessGuard(new CurrentUser());

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void allowsTheTokenUserOnly() {
        authenticate(3L);

        assertDoesNotThrow(() -> accessGuard.requireSelf(3L));
        assertThrows(ForbiddenException.class, () -> accessGuard.requireSelf(4L));
    }

    @Test
    void rejectsARequestWithoutAUserToken() {
        assertThrows(UnauthorizedException.class, () -> accessGuard.requireSelf(3L));
    }

    private static void authenticate(Long userId) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }
}
