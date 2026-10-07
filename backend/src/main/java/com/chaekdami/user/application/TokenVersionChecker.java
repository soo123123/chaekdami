package com.chaekdami.user.application;

import com.chaekdami.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TokenVersionChecker {

    private final UserRepository userRepository;

    public boolean matches(Long userId, long tokenVersion) {
        return userRepository.findById(userId)
                .map(user -> user.getTokenVersion() == tokenVersion)
                .orElse(false);
    }
}
