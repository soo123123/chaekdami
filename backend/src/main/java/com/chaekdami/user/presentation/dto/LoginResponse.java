package com.chaekdami.user.presentation.dto;

import com.chaekdami.user.application.result.IssuedTokens;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;

    public static LoginResponse from(IssuedTokens tokens) {
        return new LoginResponse(tokens.accessToken(), tokens.refreshToken(), tokens.tokenType());
    }
}