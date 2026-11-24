package com.chaekdami.reward.application;

import com.chaekdami.reward.application.port.ReadingSessionReader;
import com.chaekdami.reward.domain.ExperiencePolicy;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
import com.chaekdami.reward.domain.ShopItemType;
import com.chaekdami.reward.domain.StreakCalculator;
import com.chaekdami.reward.domain.TransactionReason;
import com.chaekdami.reward.domain.UserBuff;
import com.chaekdami.reward.infrastructure.RewardAccountRepository;
import com.chaekdami.reward.infrastructure.UserBuffRepository;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

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
    private final StreakService streakService;

    /**
     * 사용자의 보상 계정을 만든다. 이미 있으면 기존 계정을 그대로 둔다.
     * 보상 기능을 처음 쓸 때 계정이 자동으로 생기므로 회원가입 시점에 꼭 호출하지 않아도 된다.
     */
    @Transactional
    public void createAccount(Long userId) {
        rewardLedger.createAccountIfAbsent(userId);
    }

    /**
     * 보상 상태 통합 조회. 놓친 날이 있으면 방어권 자동 차감을 먼저 정산하므로 쓰기 트랜잭션이다.
     * 연속 일수는 D-day 달력으로 계산해 계정에 반영한 뒤 돌려준다. 계정이 없으면 새로 만든다.
     */
    @Transactional
    public RewardStatusResult getRewardStatus(Long userId) {
        LocalDate today = LocalDate.now();
        streakService.settleBefore(userId, today);
        rewardLedger.createAccountIfAbsent(userId);
        RewardAccount account = rewardAccountRepository.findByUserId(userId)
                .orElseThrow(() -> new RewardException(RewardErrorCode.REWARD_ACCOUNT_NOT_FOUND));
        StreakCalculator.Summary streak = streakService.summarize(userId, today);
        account.syncStreak(streak.currentStreak(), streak.longestStreak());

        ExperienceProgress progress = ExperienceProgress.of(account);
        int ownedShieldCount = userItemRepository.sumQuantityByUserIdAndItemType(userId, ShopItemType.SHIELD);
        int boosterRemainingSeconds = Math.toIntExact(userBuffRepository.sumRemainingSeconds(userId));

        return new RewardStatusResult(
                account.getLevel(),
                progress.currentExperience(),
                progress.nextLevelExperience(),
                progress.percentage(),
                account.getCurrency(),
                account.getDday(),
                ownedShieldCount,
                boosterRemainingSeconds > 0,
                boosterRemainingSeconds
        );
    }

    /**
     * 독서 세션 1회의 독서 경험치를 지급한다. 독서 시간 중 경험치 부스터가 적용된 시간 비율만큼 배율을 주고,
     * 적용한 만큼 남은 부스터 시간을 줄인다. (스펙 009)
     * 이력에 세션 id 를 남기므로, 독서 완료 보상(ReadingSessionRewardService)이 이미 지급 여부를 확인한 뒤 호출한다.
     */
    @Transactional
    public ReadingRewardResult grantReadingExperience(Long userId, ReadingSessionReader.Session session) {
        RewardAccount account = rewardLedger.lockAccount(userId);

        int experience = ExperiencePolicy.readingExperience(
                session.durationSeconds(), session.startPage(), session.endPage());
        int boostedSeconds = UserBuff.consume(
                userBuffRepository.findRemainingBuffs(userId), session.endedAt(), session.durationSeconds());
        boolean boosted = boostedSeconds > 0;
        experience = ExperiencePolicy.boostedExperience(experience, boostedSeconds, session.durationSeconds());

        int promotionReward = rewardLedger.addExperienceFor(
                account, experience, TransactionReason.READING_COMPLETE, session.id());
        return new ReadingRewardResult(experience, boosted, promotionReward, account.getLevel());
    }
}
