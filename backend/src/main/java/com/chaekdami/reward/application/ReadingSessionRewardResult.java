package com.chaekdami.reward.application;

import java.util.List;

/**
 * 독서 완료 화면 보상 결과
 *
 * @param baseGranted     이번 요청에서 기본 보상(독서 경험치, 퀘스트, D-day)을 처리했는지. 이미 처리한 세션이면 false
 * @param reading         독서 경험치 (기본 보상을 이번에 처리하지 않았으면 0)
 * @param photoBonus      사진 인증 추가 보상
 * @param completedQuests 이번 세션으로 달성해 자동 지급된 퀘스트
 * @param streak          요청 처리 후 연속 독서 일수와 이번에 자동으로 쓴 방어권 수
 * @param promotionReward 이번 요청의 레벨업으로 받은 승급 보상 재화 합계
 * @param levelBefore     요청 처리 전 레벨
 * @param level           요청 처리 후 레벨
 * @param currency        요청 처리 후 보유 재화
 */
public record ReadingSessionRewardResult(
        Long readingSessionId,
        boolean baseGranted,
        Reading reading,
        PhotoBonus photoBonus,
        List<CompletedQuest> completedQuests,
        Streak streak,
        int promotionReward,
        int levelBefore,
        int level,
        int currency
) {

    public boolean leveledUp() {
        return level > levelBefore;
    }

    public record Reading(int experience, boolean boosted) {
    }

    /**
     * @param granted 이번 요청에서 추가 보상을 지급했으면 true. 인증이 없거나 이미 지급한 세션이면 false
     */
    public record PhotoBonus(boolean granted, int experience, int currency) {

        static PhotoBonus notGranted() {
            return new PhotoBonus(false, 0, 0);
        }
    }

    /**
     * @param currentStreak 현재 연속 독서 일수 (방어한 날은 +0)
     * @param shieldsUsed   이번 요청에서 놓친 날을 막느라 자동으로 쓴 방어권 수
     */
    public record Streak(int currentStreak, int longestStreak, int shieldsUsed) {
    }

    public record CompletedQuest(
            Long userQuestId,
            String title,
            int rewardCurrency,
            int rewardExperience
    ) {
    }
}
