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
import static org.junit.jupiter.api.Assertions.assertTrue;

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
        AccessTokenClaims parsed = provider.parse(token).orElseThrow();
        assertEquals(3L, parsed.tokenVersion());
        assertEquals(7L, parsed.userId());
        assertEquals("USER", parsed.role());
    }

    @Test
    void rejectsTamperedToken() {
        JwtTokenProvider provider = new JwtTokenProvider(SECRET);
        String token = provider.createAccessToken(7L, "USER", 3L);

        assertTrue(provider.parse(token + "x").isEmpty());
        assertTrue(provider.parse("not.a.token").isEmpty());
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
        assertEquals(-1L, provider.parse(legacy).orElseThrow().tokenVersion());
    }

    @Test
    void rejectsMissingOrShortSecret() {
        assertThrows(IllegalStateException.class, () -> new JwtTokenProvider(" "));
        String shortSecret = Base64.getEncoder().encodeToString(new byte[16]);
        assertThrows(IllegalStateException.class, () -> new JwtTokenProvider(shortSecret));
        assertThrows(IllegalStateException.class, () -> new JwtTokenProvider("@@@"));
    }
}
