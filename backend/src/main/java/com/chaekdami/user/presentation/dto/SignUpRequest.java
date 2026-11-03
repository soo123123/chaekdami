package com.chaekdami.user.presentation.dto;

import com.chaekdami.user.presentation.validation.NicknamePolicy;
import com.chaekdami.user.presentation.validation.PasswordNotIdentity;
import com.chaekdami.user.presentation.validation.PasswordPolicy;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@PasswordNotIdentity
public class SignUpRequest {
    @NotBlank
    @Email
    @Size(max = 254, message = "이메일은 254자 이하여야 합니다.")
    private String email;

    @NotBlank
    @Size(min = 8, max = 72, message = "비밀번호는 8자 이상 72자 이하여야 합니다.")
    @PasswordPolicy
    private String password;

    @NotBlank
    @NicknamePolicy
    private String nickname;
}
