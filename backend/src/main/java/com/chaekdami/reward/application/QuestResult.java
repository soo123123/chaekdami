package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.Quest;
import com.chaekdami.reward.domain.QuestStatus;
import com.chaekdami.reward.domain.QuestType;
import com.chaekdami.reward.domain.UserQuest;

/**
 * 퀘스트 목록 조회 결과 한 건
 */
public record QuestResult(
        Long userQuestId,
        Long questId,
        String title,
        QuestType type,
        int targetValue,
        int currentProgress,
        QuestStatus status,
        int rewardCurrency,
        int rewardExperience
) {

    static QuestResult from(UserQuest userQuest) {
        Quest quest = userQuest.getQuest();
        return new QuestResult(
                userQuest.getId(),
                quest.getId(),
                quest.getTitle(),
                quest.getType(),
                quest.getTargetValue(),
                userQuest.getProgress(),
                userQuest.getStatus(),
                quest.getRewardCurrency(),
                quest.getRewardExperience()
        );
    }
}
