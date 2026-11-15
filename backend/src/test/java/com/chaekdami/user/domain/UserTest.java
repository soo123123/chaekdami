package com.chaekdami.user.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UserTest {

    @Test
    void newUserStartsAtVersionZeroAndBumpIncreasesIt() {
        User user = User.builder()
                .email("reader@chaekdami.local")
                .passwordHash("hash")
                .nickname("reader")
                .role(Role.USER)
                .build();

        assertEquals(0L, user.getTokenVersion());
        user.bumpTokenVersion();
        user.bumpTokenVersion();
        assertEquals(2L, user.getTokenVersion());
    }
}
