package com.chaekdami.review.infrastructure;

import com.chaekdami.review.application.port.UserLock;
import com.chaekdami.user.application.exception.UnauthorizedException;
import com.chaekdami.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserRepositoryLock implements UserLock {

    private final UserRepository userRepository;

    @Override
    public void lock(Long userId) {
        userRepository.findByIdForUpdate(userId).orElseThrow(UnauthorizedException::new);
    }
}
