package com.chaekdami.reward.application;

import com.chaekdami.dday.application.DdayService;
import com.chaekdami.reward.application.port.PhotoCertificationChecker;
import com.chaekdami.reward.application.port.ReadingSessionReader;
import com.chaekdami.reward.domain.ExperiencePolicy;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
import com.chaekdami.reward.domain.TransactionReason;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 독서 완료 화면 보상. 독서 세션 1건에 대해 다음을 한 번에 처리한다.
 * - 기본 보상: 독서 경험치(부스터 적용), 퀘스트 진행과 달성 시 자동 지급, D-day 읽은 날 기록
 * - 사진 인증 추가 보상: BE1 이 사진 인증을 확인한 세션이면 경험치 추가 (부스터 미적용, 재화 없음)
 * 기본 보상과 추가 보상은 각각 세션당 한 번만 처리한다. 완료 화면을 다시 열거나 요청을 재시도해도 다시 지급하지 않는다.
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
    private final ReadingSessionReader readingSessionReader;
    private final PhotoCertificationChecker photoCertificationChecker;

    @Transactional
    public ReadingSessionRewardResult grant(Long userId, Long readingSessionId) {
        RewardAccount account = rewardLedger.lockAccount(userId);
        ReadingSessionReader.Session session = readingSessionReader.findOwnSession(userId, readingSessionId)
                .orElseThrow(() -> new RewardException(RewardErrorCode.READING_SESSION_NOT_FOUND));
        int levelBefore = account.getLevel();
        int promotionReward = 0;

        boolean baseGranted = !rewardLedger.isExperienceGranted(
                userId, TransactionReason.READING_COMPLETE, readingSessionId);
        ReadingSessionRewardResult.Reading reading = new ReadingSessionRewardResult.Reading(0, false);
        List<ReadingSessionRewardResult.CompletedQuest> completedQuests = List.of();
        if (baseGranted) {
            LocalDate readingDate = session.endedAt().toLocalDate();
            ReadingRewardResult readingReward = rewardService.grantReadingExperience(userId, session);
            QuestSessionResult quests = questService.recordReadingSession(
                    userId, session.durationSeconds(), readingDate);
            ddayService.markRead(userId, readingDate);

            reading = new ReadingSessionRewardResult.Reading(readingReward.experience(), readingReward.boosted());
            completedQuests = toCompletedQuests(quests);
            promotionReward += readingReward.promotionReward()
                    + quests.rewarded().stream().mapToInt(QuestRewardResult::promotionReward).sum();
        }

        ReadingSessionRewardResult.PhotoBonus photoBonus = ReadingSessionRewardResult.PhotoBonus.notGranted();
        if (isPhotoCertified(userId, readingSessionId)
                && !rewardLedger.isExperienceGranted(userId, TransactionReason.PHOTO_CERTIFICATION, readingSessionId)) {
            int experience = ExperiencePolicy.PHOTO_CERTIFICATION_EXPERIENCE;
            promotionReward += rewardLedger.addExperienceFor(
                    account, experience, TransactionReason.PHOTO_CERTIFICATION, readingSessionId);
            photoBonus = new ReadingSessionRewardResult.PhotoBonus(true, experience, 0);
        }

        return new ReadingSessionRewardResult(
                readingSessionId,
                baseGranted,
                reading,
                photoBonus,
                completedQuests,
                promotionReward,
                levelBefore,
                account.getLevel(),
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

    private static List<ReadingSessionRewardResult.CompletedQuest> toCompletedQuests(QuestSessionResult quests) {
        Map<Long, String> titles = quests.quests().stream()
                .filter(quest -> quest.userQuestId() != null)
                .collect(Collectors.toMap(QuestResult::userQuestId, QuestResult::title, (first, second) -> first));
        return quests.rewarded().stream()
                .map(reward -> new ReadingSessionRewardResult.CompletedQuest(
                        reward.userQuestId(),
                        titles.get(reward.userQuestId()),
                        reward.rewardCurrency(),
                        reward.rewardExperience()))
                .toList();
    }
}
