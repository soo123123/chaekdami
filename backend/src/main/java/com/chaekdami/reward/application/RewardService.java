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
     * 연속 일수는 D-day 달력으로 계산한 값을 그대로 돌려준다. 계정이 없으면 새로 만든다.
     * 계정을 잠그지 않고 읽으므로 계정 값은 바꾸지 않는다. (바꾸면 동시에 처리된 구매/보상 결과를 옛값으로 덮어쓴다)
     */
    @Transactional
    public RewardStatusResult getRewardStatus(Long userId) {
        LocalDate today = LocalDate.now();
        streakService.settleBefore(userId, today);
        rewardLedger.createAccountIfAbsent(userId);
        RewardAccount account = rewardAccountRepository.findByUserId(userId)
                .orElseThrow(() -> new RewardException(RewardErrorCode.REWARD_ACCOUNT_NOT_FOUND));
        StreakCalculator.Summary streak = streakService.summarize(userId, today);

        ExperienceProgress progress = ExperienceProgress.of(account);
        int ownedShieldCount = userItemRepository.sumQuantityByUserIdAndItemType(userId, ShopItemType.SHIELD);
        List<UserBuff> activeBuffs = userBuffRepository.findActiveBuffs(userId, LocalDateTime.now());

        return new RewardStatusResult(
                account.getLevel(),
                progress.currentExperience(),
                progress.nextLevelExperience(),
                progress.percentage(),
                account.getCurrency(),
                streak.currentStreak(),
                ownedShieldCount,
                !activeBuffs.isEmpty(),
                activeBuffs.isEmpty() ? null : activeBuffs.get(0).getBuffEndAt()
        );
    }

    /**
     * 독서 세션 1회의 독서 경험치를 지급한다. 독서 시간 중 경험치 부스터가 적용된 시간 비율만큼 배율을 준다.
     * 이력에 세션 id 를 남기므로, 독서 완료 보상(ReadingSessionRewardService)이 이미 지급 여부를 확인한 뒤 호출한다.
     */
    @Transactional
    public ReadingRewardResult grantReadingExperience(Long userId, ReadingSessionReader.Session session) {
        RewardAccount account = rewardLedger.lockAccount(userId);

        int experience = ExperiencePolicy.readingExperience(
                session.durationSeconds(), session.startPage(), session.endPage());
        boolean boosted;
        if (session.durationSeconds() > 0) {
            // 독서 구간 [종료 - 독서 시간, 종료) 중 부스터가 적용된 시간 비율만큼만 2배
            LocalDateTime startedAt = session.endedAt().minusSeconds(session.durationSeconds());
            List<UserBuff> buffs = userBuffRepository.findOverlappingBuffs(userId, startedAt, session.endedAt());
            long boostedSeconds = UserBuff.overlapSeconds(buffs, startedAt, session.endedAt());
            boosted = boostedSeconds > 0;
            experience = ExperiencePolicy.boostedExperience(experience, boostedSeconds, session.durationSeconds());
        } else {
            // 독서 시간이 없으면(쪽수 경험치만) 종료 시각에 적용 중인지로 판단
            boosted = !userBuffRepository.findActiveBuffs(userId, session.endedAt()).isEmpty();
            if (boosted) {
                experience = ExperiencePolicy.boostedExperience(experience);
            }
        }

        int promotionReward = rewardLedger.addExperienceFor(
                account, experience, TransactionReason.READING_COMPLETE, session.id());
        return new ReadingRewardResult(experience, boosted, promotionReward, account.getLevel());
    }
}
