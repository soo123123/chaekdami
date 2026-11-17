package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.QuestStatus;
import com.chaekdami.reward.domain.QuestType;
import com.chaekdami.reward.domain.RewardAccount;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReadingSessionRewardServiceTest {

    private static final Long USER_ID = 1L;

    @Mock
    private RewardLedger rewardLedger;
    @Mock
    private StreakService streakService;
    @Mock
    private RewardService rewardService;
    @Mock
    private QuestService questService;
    @InjectMocks
    private ReadingSessionRewardService readingSessionRewardService;

    @Test
    void 스트릭_경험치_퀘스트_결과를_하나로_모아_돌려준다() {
        RewardAccount account = RewardAccount.builder().userId(USER_ID).build();
        when(rewardLedger.lockAccount(USER_ID)).thenReturn(account);
        StreakResult streak = new StreakResult(3, 5, 0, true);
        when(streakService.recordReadingDay(USER_ID)).thenReturn(streak);
        when(rewardService.grantReadingExperience(USER_ID, 1800, 30, 52)).thenAnswer(invocation -> {
            int promotion = account.addExperience(34 + 46);   // Lv.1 -> Lv.2 (누적 80)
            return new ReadingRewardResult(80, false, promotion, account.getLevel());
        });
        QuestResult firstSession = new QuestResult(11L, 1L, "오늘의 첫 독서 세션 시작하기", QuestType.DAILY,
                1, 1, QuestStatus.REWARDED, 50, 10);
        when(questService.recordReadingSession(USER_ID, 1800)).thenReturn(new QuestSessionResult(
                List.of(firstSession),
                List.of(new QuestRewardResult(11L, 50, 10, 0, 150, 2))));

        ReadingSessionRewardResult result = readingSessionRewardService.grant(USER_ID, 1800, 30, 52);

        assertThat(result.experience()).isEqualTo(80);
        assertThat(result.levelBefore()).isEqualTo(1);
        assertThat(result.level()).isEqualTo(2);
        assertThat(result.leveledUp()).isTrue();
        assertThat(result.promotionReward()).isEqualTo(100);
        assertThat(result.completedQuests()).singleElement().satisfies(quest -> {
            assertThat(quest.title()).isEqualTo("오늘의 첫 독서 세션 시작하기");
            assertThat(quest.rewardCurrency()).isEqualTo(50);
        });
        assertThat(result.streak()).isSameAs(streak);
    }
}
