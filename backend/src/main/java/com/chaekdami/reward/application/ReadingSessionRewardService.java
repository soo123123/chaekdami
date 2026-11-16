package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.RewardAccount;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 독서 세션 1회 완료에 대한 보상을 한 번에 처리한다. (보상 파트의 독서 연동 진입점)
 * - 스트릭: 놓친 날 방어권 정산 후 오늘 독서 성공 기록
 * - 경험치: 독서 시간 + 읽은 쪽수 (부스터 적용)
 * - 퀘스트: 진행도 반영, 달성한 퀘스트는 보상 자동 지급
 * 독서 저장과 분리된 새 트랜잭션에서 실행한다. 독서 저장 직후 호출은 ReadingSessionRewardHook 을 사용한다.
 */
@Service
@RequiredArgsConstructor
public class ReadingSessionRewardService {

    private final RewardLedger rewardLedger;
    private final StreakService streakService;
    private final RewardService rewardService;
    private final QuestService questService;

    /**
     * @param durationSeconds 검증된 독서 시간(초). 독서 도메인이 1초 ~ 2시간으로 검증한다.
     * @param startPage       세션 시작 페이지
     * @param endPage         세션에서 읽은 마지막 페이지 (읽은 쪽 수 = endPage - startPage)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ReadingSessionRewardResult grant(Long userId, int durationSeconds, int startPage, int endPage) {
        RewardAccount account = rewardLedger.lockAccount(userId);
        int levelBefore = account.getLevel();

        StreakResult streak = streakService.recordReadingDay(userId);
        ReadingRewardResult reading = rewardService.grantReadingExperience(userId, durationSeconds, startPage, endPage);
        QuestSessionResult quests = questService.recordReadingSession(userId, durationSeconds);

        Map<Long, String> titles = quests.quests().stream()
                .collect(Collectors.toMap(QuestResult::userQuestId, QuestResult::title, (first, second) -> first));
        List<ReadingSessionRewardResult.CompletedQuest> completedQuests = quests.rewarded().stream()
                .map(reward -> new ReadingSessionRewardResult.CompletedQuest(
                        reward.userQuestId(),
                        titles.get(reward.userQuestId()),
                        reward.rewardCurrency(),
                        reward.rewardExperience()))
                .toList();
        int promotionReward = reading.promotionReward()
                + quests.rewarded().stream().mapToInt(QuestRewardResult::promotionReward).sum();

        return new ReadingSessionRewardResult(
                reading.experience(),
                reading.boosted(),
                completedQuests,
                promotionReward,
                levelBefore,
                account.getLevel(),
                account.getCurrency(),
                streak
        );
    }
}
