package com.chaekdami.reward.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserQuestTest {

    private final Quest quest = Quest.builder()
            .type(QuestType.DAILY)
            .title("오늘 독서 15분 달성하기")
            .targetValue(15)
            .rewardCurrency(75)
            .rewardExperience(15)
            .build();
    private final UserQuest userQuest = UserQuest.builder().userId(1L).quest(quest).build();

    @Test
    void 목표에_도달하면_완료되고_진행도는_목표치를_넘지_않는다() {
        userQuest.updateProgress(10);
        assertThat(userQuest.getStatus()).isEqualTo(QuestStatus.IN_PROGRESS);

        userQuest.updateProgress(10);
        assertThat(userQuest.getProgress()).isEqualTo(15);
        assertThat(userQuest.getStatus()).isEqualTo(QuestStatus.COMPLETED);
        assertThat(userQuest.getCompletedAt()).isNotNull();
    }

    @Test
    void 완료_후_진행도_반영은_무시한다() {
        userQuest.updateProgress(15);
        userQuest.updateProgress(5);

        assertThat(userQuest.getProgress()).isEqualTo(15);
    }

    @Test
    void 미완료_퀘스트_보상_요청은_QUEST_001() {
        assertThatThrownBy(userQuest::claimReward)
                .isInstanceOf(RewardException.class)
                .extracting("errorCode").isEqualTo(RewardErrorCode.QUEST_NOT_COMPLETED);
    }

    @Test
    void 보상은_한번만_받는다_QUEST_002() {
        userQuest.updateProgress(15);
        userQuest.claimReward();

        assertThat(userQuest.getStatus()).isEqualTo(QuestStatus.REWARDED);
        assertThatThrownBy(userQuest::claimReward)
                .isInstanceOf(RewardException.class)
                .extracting("errorCode").isEqualTo(RewardErrorCode.QUEST_ALREADY_REWARDED);
    }
}
