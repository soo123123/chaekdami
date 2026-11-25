package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.application.port.RankingTargetChecker;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 회원 도메인의 UserRepository 를 읽기만 해서 랭킹 대상인지 확인한다. 기준은 RankingTargets 와 같다.
 */
@Component
@RequiredArgsConstructor
public class RewardRankingTargetChecker implements RankingTargetChecker {

    private final UserRepository userRepository;

    @Override
    public boolean isTarget(Long userId, LocalDateTime now) {
        return userRepository.findById(userId)
                .filter(user -> user.getRole() != Role.ADMIN && !user.isSuspendedAt(now))
                .isPresent();
    }
}
