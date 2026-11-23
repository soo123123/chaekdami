package com.chaekdami.user.presentation.dto;

import com.chaekdami.user.domain.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChangeRoleRequest {

    @NotNull(message = "역할을 입력해야 합니다.")
    private Role role;
}
