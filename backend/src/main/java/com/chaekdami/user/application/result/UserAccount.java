package com.chaekdami.user.application.result;

import com.chaekdami.user.domain.User;

public record UserAccount(Long id, String email, String nickname, String role) {

    public static UserAccount from(User user) {
        return new UserAccount(user.getId(), user.getEmail(), user.getNickname(), user.getRole().name());
    }
}
