package com.chaekdami.user.application;

import com.chaekdami.user.application.exception.ForbiddenException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AccessGuard {

    private final CurrentUser currentUser;

    public void requireSelf(Long ownerId) {
        if (ownerId == null || !ownerId.equals(currentUser.requireId())) {
            throw new ForbiddenException();
        }
    }
}
