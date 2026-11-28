package com.chaekdami.reminder.infrastructure;

import com.chaekdami.reminder.application.port.ReminderUserReader;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserRepositoryReminderReader implements ReminderUserReader {

    private final UserRepository userRepository;

    @Override
    public String nicknameOf(Long userId) {
        return userRepository.findById(userId).map(User::getNickname).orElse("");
    }
}
