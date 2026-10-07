package com.chaekdami.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtTokenProviderTest {

    private static final String SECRET = Base64.getEncoder().encodeToString(new byte[32]);

    @Test
    void accessTokenExpiresInFifteenMinutesAndCarriesVersion() {
        JwtTokenProvider provider = new JwtTokenProvider(SECRET);
        String token = provider.createAccessToken(7L, "USER", 3L);

        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET));
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();

        long seconds = (claims.getExpiration().getTime() - claims.getIssuedAt().getTime()) / 1000;
        assertEquals(900, seconds);
        assertEquals(3L, provider.getTokenVersion(token));
        assertEquals(7L, provider.getUserId(token));
    }

    @Test
    void tokenWithoutVersionDoesNotMatchAnyUser() {
        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET));
        String legacy = Jwts.builder()
                .subject("1")
                .claim("role", "USER")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(key)
                .compact();

        JwtTokenProvider provider = new JwtTokenProvider(SECRET);
        assertEquals(-1L, provider.getTokenVersion(legacy));
    }

    @Test
    void rejectsMissingOrShortSecret() {
        assertThrows(IllegalStateException.class, () -> new JwtTokenProvider(" "));
        String shortSecret = Base64.getEncoder().encodeToString(new byte[16]);
        assertThrows(IllegalStateException.class, () -> new JwtTokenProvider(shortSecret));
        assertThrows(IllegalStateException.class, () -> new JwtTokenProvider("@@@"));
    }
}
