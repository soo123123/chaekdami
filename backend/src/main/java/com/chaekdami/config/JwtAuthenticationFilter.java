package com.chaekdami.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Set;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final Set<String> CONDITIONAL_HEADERS = Set.of(
            HttpHeaders.IF_NONE_MATCH,
            HttpHeaders.IF_MODIFIED_SINCE,
            HttpHeaders.IF_MATCH,
            HttpHeaders.IF_UNMODIFIED_SINCE
    );

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        HttpServletRequest effectiveRequest = wrapWithoutCacheValidators(request);

        String token = resolveToken(effectiveRequest);
        log.debug(">>> [JWT Filter] {} {} (dispatcher={})",
                effectiveRequest.getMethod(),
                effectiveRequest.getRequestURI(),
                effectiveRequest.getDispatcherType());

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            try {
                Long userId = jwtTokenProvider.getUserId(token);
                String role = jwtTokenProvider.getRole(token);
                List<SimpleGrantedAuthority> authorities =
                        Collections.singletonList(new SimpleGrantedAuthority(toSpringRole(role)));
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (RuntimeException exception) {
                log.warn(">>> [JWT] Access token rejected");
            }
        }

        applyNoStoreHeaders(response);
        filterChain.doFilter(effectiveRequest, response);
        log.debug(">>> [JWT Filter] Completed {} {} -> status={}",
                effectiveRequest.getMethod(),
                effectiveRequest.getRequestURI(),
                response.getStatus());
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length()).trim();
        }
        return null;
    }

    private static String toSpringRole(String role) {
        if (!StringUtils.hasText(role)) {
            return "ROLE_USER";
        }
        return role.startsWith("ROLE_") ? role : "ROLE_" + role;
    }

    /**
     * GET 재요청 시 브라우저가 보내는 If-None-Match / If-Modified-Since 를 제거해
     * Spring MVC가 304 Not Modified 를 내지 않도록 한다.
     */
    private static boolean isConditionalHeader(String name) {
        if (name == null) {
            return false;
        }
        return CONDITIONAL_HEADERS.stream().anyMatch(header -> header.equalsIgnoreCase(name));
    }

    private static HttpServletRequest wrapWithoutCacheValidators(HttpServletRequest request) {
        return new HttpServletRequestWrapper(request) {
            @Override
            public String getHeader(String name) {
                if (isConditionalHeader(name)) {
                    return null;
                }
                return super.getHeader(name);
            }

            @Override
            public java.util.Enumeration<String> getHeaders(String name) {
                if (isConditionalHeader(name)) {
                    return Collections.emptyEnumeration();
                }
                return super.getHeaders(name);
            }

            @Override
            public java.util.Enumeration<String> getHeaderNames() {
                List<String> names = Collections.list(super.getHeaderNames()).stream()
                        .filter(name -> !isConditionalHeader(name))
                        .toList();
                return Collections.enumeration(names);
            }
        };
    }

    private static void applyNoStoreHeaders(HttpServletResponse response) {
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0");
        response.setHeader(HttpHeaders.PRAGMA, "no-cache");
        response.setHeader(HttpHeaders.EXPIRES, "0");
    }
}
