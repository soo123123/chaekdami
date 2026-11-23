package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.application.port.UserNicknameReader;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

/**
 * 회원 도메인의 UserRepository 를 읽기만 해서 닉네임을 가져온다. (user 코드는 수정하지 않는다)
 * review 의 UserRepositoryNicknameReader 와 빈 이름이 겹치지 않게 이름을 다르게 둔다.
 */
@Component
@RequiredArgsConstructor
public class RewardUserNicknameReader implements UserNicknameReader {

    private final UserRepository userRepository;

    @Override
    public Map<Long, String> findNicknames(Collection<Long> userIds) {
        Map<Long, String> nicknames = new HashMap<>();
        if (userIds.isEmpty()) {
            return nicknames;
        }
        for (User user : userRepository.findAllById(userIds)) {
            nicknames.put(user.getId(), user.getNickname());
        }
        return nicknames;
    }
}
