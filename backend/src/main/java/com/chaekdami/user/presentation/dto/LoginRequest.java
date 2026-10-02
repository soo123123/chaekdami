package com.chaekdami.user.presentation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class LoginRequest {
    @NotBlank
    @Email
    @Size(max = 254, message = "이메일은 254자 이하여야 합니다.")
    private String email;

    @NotBlank
    private String password;
}