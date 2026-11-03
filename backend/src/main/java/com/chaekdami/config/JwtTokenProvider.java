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
import java.util.Optional;

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

    public Optional<AccessTokenClaims> parse(String token) {
        try {
            Claims claims = parseClaims(token);
            Long userId = Long.valueOf(claims.getSubject());
            Object role = claims.get("role");
            Object version = claims.get("tokenVersion");
            return Optional.of(new AccessTokenClaims(
                    userId,
                    role != null ? role.toString() : "USER",
                    version instanceof Number number ? number.longValue() : -1L));
        } catch (JwtException | IllegalArgumentException e) {
            log.warn(">>> [JWT] Token validation failed: {}", e.getMessage());
            return Optional.empty();
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