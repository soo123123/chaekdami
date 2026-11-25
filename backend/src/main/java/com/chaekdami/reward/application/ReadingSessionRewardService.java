package com.chaekdami.reward.application;

import com.chaekdami.dday.application.DdayService;
import com.chaekdami.reading.domain.ReadingSession;
import com.chaekdami.reward.application.port.PhotoCertificationChecker;
import com.chaekdami.reward.application.port.ReadingSessionReader;
import com.chaekdami.reward.domain.ExperiencePolicy;
import com.chaekdami.reward.domain.ReadingSessionReward;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
import com.chaekdami.reward.domain.StreakCalculator;
import com.chaekdami.reward.domain.TransactionReason;
import com.chaekdami.reward.infrastructure.ReadingSessionRewardRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionOperations;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 독서 완료 화면 보상. 독서 세션 1건에 대해 다음을 한 번에 처리한다.
 * - 기본 보상: 독서 경험치(부스터 적용), 퀘스트 진행과 달성 시 자동 지급,
 *   D-day 읽은 날 기록 (그 전에 놓친 날은 방어권으로 자동 정산,
 *   보상이 늦게 처리돼 그날이 이미 "방어"로 막혀 있었으면 그 방어권은 돌려줌)
 * - 사진 인증 추가 보상: BE1 이 사진 인증을 확인한 세션이면 경험치 추가 (부스터 미적용, 재화 없음)
 * 기본 보상과 추가 보상은 각각 세션당 한 번만 처리한다. 완료 화면을 다시 열거나 요청을 재시도해도 다시 지급하지 않고,
 * 이 세션으로 받았던 보상 내역(reading_session_rewards)을 그대로 돌려준다.
 * 퀘스트와 D-day 날짜는 요청 시각이 아니라 세션이 끝난 날짜를 기준으로 한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReadingSessionRewardService {

    private final RewardLedger rewardLedger;
    private final RewardService rewardService;
    private final QuestService questService;
    private final DdayService ddayService;
    private final StreakService streakService;
    private final ReadingSessionReader readingSessionReader;
    private final PhotoCertificationChecker photoCertificationChecker;
    private final ReadingSessionRewardRepository readingSessionRewardRepository;
    private final TransactionOperations transactionOperations;

    /**
     * 사진 인증 조회는 보상 트랜잭션을 시작하기 전에 끝낸다. 같은 트랜잭션에서 조회하면 실패를 잡아도
     * 트랜잭션이 롤백 전용이 되어 기본 보상까지 취소된다. (조회용 새 트랜잭션을 안에서 열면 DB 연결을 2개 쓴다)
     * 그래서 이 메서드는 트랜잭션 밖에서 호출해야 한다.
     */
    public ReadingSessionRewardResult grant(Long userId, Long readingSessionId) {
        boolean photoCertified = isPhotoCertified(userId, readingSessionId);
        return transactionOperations.execute(status -> grantInTransaction(userId, readingSessionId, photoCertified));
    }

    private ReadingSessionRewardResult grantInTransaction(Long userId, Long readingSessionId, boolean photoCertified) {
        RewardAccount account = rewardLedger.lockAccount(userId);
        ReadingSessionReader.Session session = readingSessionReader.findOwnSession(userId, readingSessionId)
                .orElseThrow(() -> new RewardException(RewardErrorCode.READING_SESSION_NOT_FOUND));
        // 최소 시간 검사 전에 저장된 3분 미만 세션이 남아 있을 수 있으므로 보상 기록을 만들기 전에 거절한다.
        if (session.durationSeconds() < ReadingSession.MIN_SECONDS) {
            throw new RewardException(RewardErrorCode.READING_SESSION_TOO_SHORT);
        }
        ReadingSessionReward reward = readingSessionRewardRepository
                .findByUserIdAndReadingSessionId(userId, readingSessionId)
                .orElseGet(() -> readingSessionRewardRepository.save(
                        ReadingSessionReward.start(userId, readingSessionId, account.getLevel())));

        boolean baseGranted = !rewardLedger.isExperienceGranted(
                userId, TransactionReason.READING_COMPLETE, readingSessionId);
        if (baseGranted) {
            grantBase(account, session, reward);
        }

        if (photoCertified
                && !rewardLedger.isExperienceGranted(userId, TransactionReason.PHOTO_CERTIFICATION, readingSessionId)) {
            int experience = ExperiencePolicy.PHOTO_CERTIFICATION_EXPERIENCE;
            int promotionReward = rewardLedger.addExperienceFor(
                    account, experience, TransactionReason.PHOTO_CERTIFICATION, readingSessionId);
            reward.recordPhotoBonus(experience, promotionReward);
            reward.recordLevelAfter(account.getLevel());
        }

        StreakCalculator.Summary streak = streakService.summarize(userId, LocalDate.now());
        account.syncStreak(streak.currentStreak(), streak.longestStreak());

        return toResult(baseGranted, reward, streak, account);
    }

    private void grantBase(RewardAccount account, ReadingSessionReader.Session session, ReadingSessionReward reward) {
        Long userId = account.getUserId();
        LocalDate readingDate = session.endedAt().toLocalDate();
        ReadingRewardResult readingReward = rewardService.grantReadingExperience(userId, session);
        QuestSessionResult quests = questService.recordReadingSession(userId, session.durationSeconds(), readingDate);
        int shieldsUsed = streakService.settleBefore(userId, readingDate);
        boolean shieldRefunded = streakService.refundShieldIfProtected(userId, readingDate);
        ddayService.markRead(userId, readingDate);

        int promotionReward = readingReward.promotionReward()
                + quests.rewarded().stream().mapToInt(QuestRewardResult::promotionReward).sum();
        reward.recordBase(readingReward.experience(), readingReward.boosted(), toCompletedQuests(quests),
                shieldsUsed, shieldRefunded, promotionReward);
        reward.recordLevelAfter(account.getLevel());
    }

    /**
     * 보상 내역은 이 세션으로 받은 것 전체(저장된 기록), 레벨/경험치/재화/연속 일수는 지금 값이다.
     */
    private static ReadingSessionRewardResult toResult(boolean baseGranted, ReadingSessionReward reward,
                                                       StreakCalculator.Summary streak, RewardAccount account) {
        return new ReadingSessionRewardResult(
                reward.getReadingSessionId(),
                baseGranted,
                new ReadingSessionRewardResult.Reading(reward.getReadingExperience(), reward.isBoosted()),
                reward.hasPhotoBonus()
                        ? new ReadingSessionRewardResult.PhotoBonus(true, reward.getPhotoBonusExperience(), 0)
                        : ReadingSessionRewardResult.PhotoBonus.notGranted(),
                reward.getCompletedQuests().stream()
                        .map(quest -> new ReadingSessionRewardResult.CompletedQuest(quest.getUserQuestId(),
                                quest.getTitle(), quest.getRewardCurrency(), quest.getRewardExperience()))
                        .toList(),
                new ReadingSessionRewardResult.Streak(streak.currentStreak(), streak.longestStreak(),
                        reward.getShieldsUsed(), reward.isShieldRefunded()),
                reward.getPromotionReward(),
                reward.getLevelBefore(),
                reward.isLeveledUp(),
                account.getLevel(),
                ExperienceProgress.of(account),
                account.getCurrency()
        );
    }

    /**
     * BE1 조회가 실패해도 기본 보상은 그대로 지급하고 추가 보상만 건너뛴다.
     */
    private boolean isPhotoCertified(Long userId, Long readingSessionId) {
        try {
            return photoCertificationChecker.isPhotoCertified(userId, readingSessionId);
        } catch (RuntimeException e) {
            log.warn("사진 인증 조회 실패, 추가 보상 없이 진행: userId={}, readingSessionId={}", userId, readingSessionId, e);
            return false;
        }
    }

    private static List<ReadingSessionReward.CompletedQuest> toCompletedQuests(QuestSessionResult quests) {
        Map<Long, String> titles = quests.quests().stream()
                .filter(quest -> quest.userQuestId() != null)
                .collect(Collectors.toMap(QuestResult::userQuestId, QuestResult::title, (first, second) -> first));
        return quests.rewarded().stream()
                .map(reward -> new ReadingSessionReward.CompletedQuest(
                        reward.userQuestId(),
                        titles.get(reward.userQuestId()),
                        reward.rewardCurrency(),
                        reward.rewardExperience()))
                .toList();
    }
}
