package com.chaekdami.config;

public record AccessTokenClaims(Long userId, String role, long tokenVersion) {
}
