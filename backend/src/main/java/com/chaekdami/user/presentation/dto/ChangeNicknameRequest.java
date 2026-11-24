package com.chaekdami.user.presentation.dto;

import com.chaekdami.user.presentation.validation.NicknamePolicy;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChangeNicknameRequest {

    @NotBlank(message = "닉네임을 입력해야 합니다.")
    @NicknamePolicy
    private String nickname;
}
