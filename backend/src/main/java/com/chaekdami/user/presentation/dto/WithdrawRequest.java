package com.chaekdami.user.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class WithdrawRequest {

    @NotBlank(message = "현재 비밀번호를 입력해야 합니다.")
    private String currentPassword;
}
