package com.chaekdami.user.application.result;

public record IssuedTokens(String accessToken, String refreshToken, String tokenType) {

    public static IssuedTokens bearer(String accessToken, String refreshToken) {
        return new IssuedTokens(accessToken, refreshToken, "Bearer");
    }
}
