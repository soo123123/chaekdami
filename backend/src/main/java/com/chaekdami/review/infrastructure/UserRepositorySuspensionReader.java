package com.chaekdami.review.infrastructure;

import com.chaekdami.review.application.port.UserSuspensionReader;
import com.chaekdami.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class UserRepositorySuspensionReader implements UserSuspensionReader {

    private final UserRepository userRepository;

    @Override
    public boolean isSuspended(Long userId) {
        return userRepository.findById(userId)
                .filter(user -> user.isSuspendedAt(LocalDateTime.now()))
                .isPresent();
    }
}
