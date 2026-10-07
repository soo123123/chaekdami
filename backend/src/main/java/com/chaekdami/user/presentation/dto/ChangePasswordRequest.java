package com.chaekdami.user.presentation.dto;

import com.chaekdami.user.presentation.validation.PasswordPolicy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChangePasswordRequest {

    @NotBlank(message = "현재 비밀번호를 입력해야 합니다.")
    private String currentPassword;

    @NotBlank
    @Size(min = 8, max = 72, message = "비밀번호는 8자 이상 72자 이하여야 합니다.")
    @PasswordPolicy
    private String newPassword;
}
