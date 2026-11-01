package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.ExperiencePolicy;
import com.chaekdami.reward.domain.LevelPolicy;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
import com.chaekdami.reward.domain.ShopItemType;
import com.chaekdami.reward.domain.TransactionReason;
import com.chaekdami.reward.domain.UserBuff;
import com.chaekdami.reward.infrastructure.RewardAccountRepository;
import com.chaekdami.reward.infrastructure.UserBuffRepository;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 보상 계정 생성, 보상 상태 조회, 독서 완료 경험치 지급
 */
@Service
@RequiredArgsConstructor
public class RewardService {

    private final RewardAccountRepository rewardAccountRepository;
    private final UserItemRepository userItemRepository;
    private final UserBuffRepository userBuffRepository;
    private final RewardLedger rewardLedger;

    /**
     * 사용자의 보상 계정을 만든다. 이미 있으면 기존 계정을 그대로 둔다. (회원가입 직후 호출)
     */
    @Transactional
    public void createAccount(Long userId) {
        if (rewardAccountRepository.findByUserId(userId).isEmpty()) {
            rewardAccountRepository.save(RewardAccount.builder().userId(userId).build());
        }
    }

    @Transactional(readOnly = true)
    public RewardStatusResult getRewardStatus(Long userId) {
        RewardAccount account = rewardAccountRepository.findByUserId(userId)
                .orElseThrow(() -> new RewardException(RewardErrorCode.REWARD_ACCOUNT_NOT_FOUND));

        int currentExperience = account.getExperience() - LevelPolicy.totalExperienceToReach(account.getLevel());
        int nextLevelExperience = LevelPolicy.requiredExperience(account.getLevel());
        int ownedShieldCount = userItemRepository.sumQuantityByUserIdAndItemType(userId, ShopItemType.SHIELD);
        List<UserBuff> activeBuffs = userBuffRepository.findActiveBuffs(userId, LocalDateTime.now());

        return new RewardStatusResult(
                account.getLevel(),
                currentExperience,
                nextLevelExperience,
                currentExperience * 100 / nextLevelExperience,
                account.getCurrency(),
                account.getDday(),
                ownedShieldCount,
                !activeBuffs.isEmpty(),
                activeBuffs.isEmpty() ? null : activeBuffs.get(0).getBuffEndAt()
        );
    }

    /**
     * 독서 세션 완료 경험치를 지급한다. 경험치 부스터 버프가 적용 중이면 배율을 곱한다.
     * 독서 완료 유스케이스(CompleteReadingService)가 검증된 세션 값으로 호출한다.
     */
    @Transactional
    public ReadingRewardResult grantReadingExperience(Long userId, int durationSeconds, int startPage, int endPage) {
        RewardAccount account = rewardLedger.lockAccount(userId);

        int experience = ExperiencePolicy.readingExperience(durationSeconds, startPage, endPage);
        boolean boosted = !userBuffRepository.findActiveBuffs(userId, LocalDateTime.now()).isEmpty();
        if (boosted) {
            experience = ExperiencePolicy.boostedExperience(experience);
        }
        if (experience == 0) {
            return new ReadingRewardResult(0, boosted, 0, account.getLevel());
        }

        int promotionReward = rewardLedger.addExperience(account, experience, TransactionReason.READING_COMPLETE);
        return new ReadingRewardResult(experience, boosted, promotionReward, account.getLevel());
    }
}
