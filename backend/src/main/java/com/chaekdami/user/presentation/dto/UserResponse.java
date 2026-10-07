package com.chaekdami.user.presentation.dto;

import com.chaekdami.user.application.result.UserAccount;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String nickname;
    private String role;
    private boolean emailVerified;

    public static UserResponse from(UserAccount account) {
        return new UserResponse(
                account.id(), account.email(), account.nickname(), account.role(), account.emailVerified());
    }
}
