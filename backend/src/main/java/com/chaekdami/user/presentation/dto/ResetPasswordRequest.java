package com.chaekdami.user.presentation.dto;

import com.chaekdami.user.presentation.validation.PasswordPolicy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "재설정 토큰이 필요합니다.")
    private String token;

    @NotBlank
    @Size(min = 8, max = 72, message = "비밀번호는 8자 이상 72자 이하여야 합니다.")
    @PasswordPolicy
    private String newPassword;
}
