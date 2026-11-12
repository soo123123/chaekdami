package com.chaekdami.config;

import com.chaekdami.user.application.TokenVersionChecker;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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

    @Test
    void userIdHeaderIsReplacedWithTheTokenUser() throws Exception {
        TokenVersionChecker checker = mock(TokenVersionChecker.class);
        when(checker.matches(7L, 2L)).thenReturn(true);
        JwtTokenProvider provider = new JwtTokenProvider(SECRET);
        MockHttpServletRequest request = requestWith(provider.createAccessToken(7L, "USER", 2L));
        request.addHeader("X-User-Id", "99");
        AtomicReference<HttpServletRequest> forwarded = new AtomicReference<>();

        new JwtAuthenticationFilter(provider, checker).doFilter(request, new MockHttpServletResponse(),
                (req, res) -> forwarded.set((HttpServletRequest) req));

        assertEquals("7", forwarded.get().getHeader("x-user-id"));
        assertEquals(List.of("7"), Collections.list(forwarded.get().getHeaders("X-User-Id")));
    }

    @Test
    void userIdHeaderIsDroppedWithoutAuthentication() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/books");
        request.addHeader("X-User-Id", "99");
        AtomicReference<HttpServletRequest> forwarded = new AtomicReference<>();

        new JwtAuthenticationFilter(new JwtTokenProvider(SECRET), mock(TokenVersionChecker.class))
                .doFilter(request, new MockHttpServletResponse(), (req, res) -> forwarded.set((HttpServletRequest) req));

        assertNull(forwarded.get().getHeader("X-User-Id"));
        assertFalse(Collections.list(forwarded.get().getHeaderNames()).contains("X-User-Id"));
    }

    private static MockHttpServletRequest requestWith(String token) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/me");
        request.addHeader("Authorization", "Bearer " + token);
        return request;
    }
}
