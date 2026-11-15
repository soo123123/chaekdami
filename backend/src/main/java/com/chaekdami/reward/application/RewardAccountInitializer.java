package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.infrastructure.RewardAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 보상 계정을 호출한 쪽과 분리된 새 트랜잭션으로 만든다.
 * 같은 사용자의 동시 첫 요청이 먼저 만들었으면 uk_reward_accounts_user_id 위반(DataIntegrityViolationException)이
 * 이 트랜잭션만 롤백하고 호출한 쪽으로 던져지므로, 호출한 트랜잭션은 영향 없이 계속 진행할 수 있다.
 */
@Component
@RequiredArgsConstructor
class RewardAccountInitializer {

    private final RewardAccountRepository rewardAccountRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void insert(Long userId) {
        rewardAccountRepository.saveAndFlush(RewardAccount.builder().userId(userId).build());
    }
}
