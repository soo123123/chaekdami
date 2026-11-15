package com.chaekdami.reward.application;

/**
 * 퀘스트 보상 수령 결과
 *
 * @param promotionReward 보상 경험치로 레벨업해 받은 승급 보상 재화 (레벨업이 없으면 0)
 */
public record QuestRewardResult(
        Long userQuestId,
        int rewardCurrency,
        int rewardExperience,
        int promotionReward,
        int currency,
        int level
) {
}
