package com.chaekdami.reward.application;

import java.util.List;

/**
 * 독서 세션 1회 완료로 받은 보상 요약 (독서 완료 화면 표시용)
 *
 * @param experience      독서로 받은 경험치 (부스터 적용 후, 퀘스트 보상 경험치 제외)
 * @param boosted         경험치 부스터가 적용됐는지
 * @param completedQuests 이번 세션으로 달성해 자동 지급된 퀘스트
 * @param promotionReward 레벨업으로 받은 승급 보상 재화 합계 (독서 + 퀘스트 경험치 기준)
 * @param levelBefore     세션 반영 전 레벨
 * @param level           세션 반영 후 레벨
 * @param currency        세션 반영 후 보유 재화
 * @param streak          연속 독서 기록 결과
 */
public record ReadingSessionRewardResult(
        int experience,
        boolean boosted,
        List<CompletedQuest> completedQuests,
        int promotionReward,
        int levelBefore,
        int level,
        int currency,
        StreakResult streak
) {

    public boolean leveledUp() {
        return level > levelBefore;
    }

    public record CompletedQuest(
            Long userQuestId,
            String title,
            int rewardCurrency,
            int rewardExperience
    ) {
    }
}
