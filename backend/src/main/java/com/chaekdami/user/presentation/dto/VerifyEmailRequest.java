package com.chaekdami.user.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class VerifyEmailRequest {

    @NotBlank(message = "인증 토큰이 필요합니다.")
    private String token;
}
