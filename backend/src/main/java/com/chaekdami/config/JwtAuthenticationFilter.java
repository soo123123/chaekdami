package com.chaekdami.config;

import com.chaekdami.user.application.TokenVersionChecker;
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
    private static final String USER_ID_HEADER = "X-User-Id";
    private static final Set<String> CONDITIONAL_HEADERS = Set.of(
            HttpHeaders.IF_NONE_MATCH,
            HttpHeaders.IF_MODIFIED_SINCE,
            HttpHeaders.IF_MATCH,
            HttpHeaders.IF_UNMODIFIED_SINCE
    );

    private final JwtTokenProvider jwtTokenProvider;
    private final TokenVersionChecker tokenVersionChecker;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);
        log.debug(">>> [JWT Filter] {} {} (dispatcher={})",
                request.getMethod(),
                request.getRequestURI(),
                request.getDispatcherType());

        AccessTokenClaims claims = StringUtils.hasText(token)
                ? jwtTokenProvider.parse(token).orElse(null)
                : null;
        Long authenticatedUserId = null;
        if (claims != null) {
            try {
                if (!tokenVersionChecker.matches(claims.userId(), claims.tokenVersion())) {
                    log.warn(">>> [JWT] Access token version rejected");
                } else {
                    List<SimpleGrantedAuthority> authorities =
                            Collections.singletonList(new SimpleGrantedAuthority(toSpringRole(claims.role())));
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(claims.userId(), null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    authenticatedUserId = claims.userId();
                }
            } catch (RuntimeException exception) {
                log.warn(">>> [JWT] Access token rejected");
            }
        }

        HttpServletRequest effectiveRequest = wrap(request, authenticatedUserId);
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

    private static boolean isUserIdHeader(String name) {
        return USER_ID_HEADER.equalsIgnoreCase(name);
    }

    /**
     * 독서·보상 컨트롤러는 아직 {@code X-User-Id} 헤더로 사용자를 받는다.
     * 클라이언트가 보낸 값은 버리고, 인증된 요청에만 토큰의 사용자 ID를 넣는다.
     */
    private static HttpServletRequest wrap(HttpServletRequest request, Long authenticatedUserId) {
        String userId = authenticatedUserId != null ? authenticatedUserId.toString() : null;
        return new HttpServletRequestWrapper(request) {
            @Override
            public String getHeader(String name) {
                if (isConditionalHeader(name)) {
                    return null;
                }
                if (isUserIdHeader(name)) {
                    return userId;
                }
                return super.getHeader(name);
            }

            @Override
            public java.util.Enumeration<String> getHeaders(String name) {
                if (isConditionalHeader(name)) {
                    return Collections.emptyEnumeration();
                }
                if (isUserIdHeader(name)) {
                    return userId != null ? Collections.enumeration(List.of(userId)) : Collections.emptyEnumeration();
                }
                return super.getHeaders(name);
            }

            @Override
            public java.util.Enumeration<String> getHeaderNames() {
                List<String> names = new java.util.ArrayList<>(Collections.list(super.getHeaderNames()).stream()
                        .filter(name -> !isConditionalHeader(name) && !isUserIdHeader(name))
                        .toList());
                if (userId != null) {
                    names.add(USER_ID_HEADER);
                }
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
