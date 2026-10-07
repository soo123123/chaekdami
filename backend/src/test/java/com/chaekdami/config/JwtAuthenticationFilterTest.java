package com.chaekdami.config;

import com.chaekdami.user.application.TokenVersionChecker;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    private static final String SECRET = Base64.getEncoder().encodeToString(new byte[32]);

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void acceptsTokenWhenVersionMatches() throws Exception {
        TokenVersionChecker checker = mock(TokenVersionChecker.class);
        when(checker.matches(7L, 2L)).thenReturn(true);
        JwtTokenProvider provider = new JwtTokenProvider(SECRET);
        String token = provider.createAccessToken(7L, "USER", 2L);

        MockHttpServletRequest request = requestWith(token);
        new JwtAuthenticationFilter(provider, checker)
                .doFilter(request, new MockHttpServletResponse(), mock(FilterChain.class));

        assertEquals(7L, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    @Test
    void rejectsTokenWhenVersionDoesNotMatch() throws Exception {
        TokenVersionChecker checker = mock(TokenVersionChecker.class);
        when(checker.matches(7L, 2L)).thenReturn(false);
        JwtTokenProvider provider = new JwtTokenProvider(SECRET);
        String token = provider.createAccessToken(7L, "USER", 2L);

        MockHttpServletRequest request = requestWith(token);
        new JwtAuthenticationFilter(provider, checker)
                .doFilter(request, new MockHttpServletResponse(), mock(FilterChain.class));

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    private static MockHttpServletRequest requestWith(String token) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/auth/me");
        request.addHeader("Authorization", "Bearer " + token);
        return request;
    }
}
