package com.chaekdami.review.infrastructure;

import com.chaekdami.review.application.port.UserNicknameReader;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class UserRepositoryNicknameReader implements UserNicknameReader {

    private final UserRepository userRepository;

    @Override
    public Map<Long, String> findNicknames(Collection<Long> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getNickname));
    }
}
