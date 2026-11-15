package com.chaekdami.user.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RefreshTokenRequest {

    @NotBlank(message = "리프레시 토큰이 필요합니다.")
    private String refreshToken;
}
