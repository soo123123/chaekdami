package com.chaekdami.reward.presentation.dto;

import com.chaekdami.reward.application.QuestRewardResult;

/**
 * 퀘스트 보상 수령 응답
 *
 * @param promotionReward 보상 경험치로 레벨업해 받은 승급 보상 재화 (레벨업이 없으면 0)
 * @param currency        수령 후 보유 재화
 * @param level           수령 후 레벨
 */
public record QuestRewardResponse(
        Long userQuestId,
        int rewardCurrency,
        int rewardExp,
        int promotionReward,
        int currency,
        int level
) {

    public static QuestRewardResponse from(QuestRewardResult result) {
        return new QuestRewardResponse(
                result.userQuestId(),
                result.rewardCurrency(),
                result.rewardExperience(),
                result.promotionReward(),
                result.currency(),
                result.level()
        );
    }
}
