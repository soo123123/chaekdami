package com.chaekdami.reward.application;

import com.chaekdami.reward.infrastructure.RewardAccountRepository;
import com.chaekdami.reward.infrastructure.RewardTransactionRepository;
import com.chaekdami.reward.infrastructure.UserBuffRepository;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import com.chaekdami.reward.infrastructure.UserQuestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * reward 테이블은 users 에 DB FK 가 없어서, 사용자가 탈퇴할 때 여기서 함께 지운다.
 * 호출한 쪽(회원 탈퇴)의 트랜잭션에 참여해 탈퇴와 함께 커밋되거나 롤백된다.
 * 퀘스트/상품 마스터(quests, shop_items)는 사용자 데이터가 아니므로 지우지 않는다.
 * 연속 독서 기록은 D-day 달력(dday_records)에 있고, D-day 모듈의 탈퇴 리스너가 지운다.
 */
@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class RewardCleanupService {

    private final UserQuestRepository userQuestRepository;
    private final UserItemRepository userItemRepository;
    private final UserBuffRepository userBuffRepository;
    private final RewardTransactionRepository rewardTransactionRepository;
    private final RewardAccountRepository rewardAccountRepository;

    public void deleteAllOfUser(Long userId) {
        userQuestRepository.deleteAllByUserId(userId);
        userItemRepository.deleteAllByUserId(userId);
        userBuffRepository.deleteAllByUserId(userId);
        rewardTransactionRepository.deleteAllByUserId(userId);
        rewardAccountRepository.deleteAllByUserId(userId);
    }
}
