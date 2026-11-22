package com.chaekdami.reward.application;

import java.util.List;

/**
 * 독서 완료 화면 보상 결과
 *
 * 보상 내역(reading, photoBonus, completedQuests, 방어권, promotionReward, levelBefore, leveledUp)은
 * 이 세션으로 받은 것 전체다. 같은 세션으로 다시 요청하면 처음 받은 내역이 그대로 온다.
 * level, experience, currency, 연속 일수는 요청 처리 후 지금 값이다.
 *
 * @param baseGranted     이번 요청에서 기본 보상(독서 경험치, 퀘스트, D-day)을 처리했는지. 이미 처리한 세션이면 false
 * @param reading         이 세션으로 받은 독서 경험치
 * @param photoBonus      이 세션으로 받은 사진 인증 추가 보상
 * @param completedQuests 이 세션으로 달성해 자동 지급된 퀘스트
 * @param streak          지금 연속 독서 일수와, 이 세션 보상 때 자동으로 쓴 방어권 수
 * @param promotionReward 이 세션 보상의 레벨업으로 받은 승급 보상 재화 합계
 * @param levelBefore     이 세션 보상을 처음 처리하기 직전 레벨
 * @param leveledUp       이 세션 보상으로 레벨이 올랐는지
 * @param level           지금 레벨
 * @param experience      지금 레벨 구간의 경험치 진행도
 * @param currency        지금 보유 재화
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
        boolean leveledUp,
        int level,
        ExperienceProgress experience,
        int currency
) {

    public record Reading(int experience, boolean boosted) {
    }

    /**
     * @param granted 이 세션이 추가 보상을 받았으면 true (이번 요청이든 이전 요청이든)
     */
    public record PhotoBonus(boolean granted, int experience, int currency) {

        static PhotoBonus notGranted() {
            return new PhotoBonus(false, 0, 0);
        }
    }

    /**
     * @param currentStreak  현재 연속 독서 일수 (방어한 날은 +0)
     * @param shieldsUsed    이 세션 보상 때 놓친 날을 막느라 자동으로 쓴 방어권 수
     * @param shieldRefunded 독서한 날이 이미 방어권으로 막혀 있어서, 그 방어권 1개를 돌려줬는지
     */
    public record Streak(int currentStreak, int longestStreak, int shieldsUsed, boolean shieldRefunded) {
    }

    public record CompletedQuest(
            Long userQuestId,
            String title,
            int rewardCurrency,
            int rewardExperience
    ) {
    }
}
