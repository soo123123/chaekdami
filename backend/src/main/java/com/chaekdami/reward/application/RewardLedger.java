package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
import com.chaekdami.reward.domain.RewardTransaction;
import com.chaekdami.reward.domain.TransactionReason;
import com.chaekdami.reward.domain.TransactionType;
import com.chaekdami.reward.infrastructure.RewardAccountRepository;
import com.chaekdami.reward.infrastructure.RewardTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 보상 계정 잠금과 재화/경험치 변경, 변동 이력 기록을 한곳에서 처리한다.
 * 호출하는 서비스의 트랜잭션 안에서만 사용한다.
 */
@Component
@RequiredArgsConstructor
class RewardLedger {

    private final RewardAccountRepository rewardAccountRepository;
    private final RewardTransactionRepository rewardTransactionRepository;

    /**
     * 보상 계정 행을 비관적 쓰기 잠금으로 조회한다. 같은 사용자의 다른 변경 요청은 트랜잭션이 끝날 때까지 대기한다.
     */
    RewardAccount lockAccount(Long userId) {
        return rewardAccountRepository.findByUserIdWithLock(userId)
                .orElseThrow(() -> new RewardException(RewardErrorCode.REWARD_ACCOUNT_NOT_FOUND));
    }

    void addCurrency(RewardAccount account, int amount, TransactionReason reason) {
        account.addCurrency(amount);
        record(account.getUserId(), TransactionType.INCOME_CURRENCY, amount, reason);
    }

    /**
     * @return 차감 기록의 id (상점 구매 응답의 purchaseId 로 사용)
     */
    Long deductCurrency(RewardAccount account, int amount, TransactionReason reason) {
        account.deductCurrency(amount);
        return record(account.getUserId(), TransactionType.EXPENSE_CURRENCY, amount, reason).getId();
    }

    /**
     * 경험치를 지급하고, 레벨업으로 승급 보상 재화가 지급되면 LEVEL_UP 이력도 함께 남긴다.
     *
     * @return 이번 지급으로 받은 승급 보상 재화 (레벨업이 없으면 0)
     */
    int addExperience(RewardAccount account, int amount, TransactionReason reason) {
        int promotionReward = account.addExperience(amount);
        record(account.getUserId(), TransactionType.INCOME_EXPERIENCE, amount, reason);
        if (promotionReward > 0) {
            record(account.getUserId(), TransactionType.INCOME_CURRENCY, promotionReward, TransactionReason.LEVEL_UP);
        }
        return promotionReward;
    }

    private RewardTransaction record(Long userId, TransactionType type, int amount, TransactionReason reason) {
        return rewardTransactionRepository.save(RewardTransaction.builder()
                .userId(userId)
                .type(type)
                .amount(amount)
                .reason(reason)
                .build());
    }
}
