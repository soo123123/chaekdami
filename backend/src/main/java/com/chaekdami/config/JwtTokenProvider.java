package com.chaekdami.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    static final long ACCESS_TOKEN_VALIDITY_SECONDS = 15 * 60;

    private final SecretKey key;

    public JwtTokenProvider(@Value("${jwt.secret}") String secretKey) {
        this.key = Keys.hmacShaKeyFor(decodeSecret(secretKey));
    }

    public String createAccessToken(Long userId, String role, long tokenVersion) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + ACCESS_TOKEN_VALIDITY_SECONDS * 1000);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("role", role)
                .claim("tokenVersion", tokenVersion)
                .issuedAt(now)
                .expiration(validity)
                .signWith(key)
                .compact();
    }

    public Long getUserId(String token) {
        try {
            return Long.valueOf(parseClaims(token).getSubject());
        } catch (NumberFormatException exception) {
            throw new JwtException("subject is not a user id");
        }
    }

    public String getRole(String token) {
        Object role = parseClaims(token).get("role");
        return role != null ? role.toString() : "USER";
    }

    public long getTokenVersion(String token) {
        Object value = parseClaims(token).get("tokenVersion");
        if (value instanceof Number number) {
            return number.longValue();
        }
        return -1L;
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn(">>> [JWT] Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    private static byte[] decodeSecret(String secretKey) {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("JWT_SECRET 환경변수가 필요합니다.");
        }
        final byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secretKey.trim());
        } catch (RuntimeException exception) {
            throw new IllegalStateException("JWT_SECRET은 Base64 문자열이어야 합니다.", exception);
        }
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET은 32바이트 이상의 키를 Base64로 인코딩한 값이어야 합니다.");
        }
        return keyBytes;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}