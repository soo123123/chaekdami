package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.DailyQuest;
import com.chaekdami.reward.domain.QuestStatus;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.TransactionReason;
import com.chaekdami.reward.domain.UserQuest;
import com.chaekdami.reward.infrastructure.QuestRepository;
import com.chaekdami.reward.infrastructure.UserQuestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuestServiceTest {

    private static final Long USER_ID = 1L;

    @Mock
    private QuestRepository questRepository;
    @Mock
    private UserQuestRepository userQuestRepository;
    @Mock
    private RewardLedger rewardLedger;
    @InjectMocks
    private QuestService questService;

    private final RewardAccount account = RewardAccount.builder().userId(USER_ID).build();
    private final UserQuest firstSession = userQuest(DailyQuest.FIRST_READING_SESSION);
    private final UserQuest reading15 = userQuest(DailyQuest.READING_15_MINUTES);

    @BeforeEach
    void setUp() {
        when(rewardLedger.lockAccount(USER_ID)).thenReturn(account);
    }

    @Test
    void 세션으로_목표를_달성한_퀘스트는_수령_요청_없이_바로_보상을_지급한다() {
        todayQuests(firstSession, reading15);

        QuestSessionResult result = questService.recordReadingSession(USER_ID, 600);   // 10분

        assertThat(firstSession.getStatus()).isEqualTo(QuestStatus.REWARDED);
        assertThat(reading15.getStatus()).isEqualTo(QuestStatus.IN_PROGRESS);
        assertThat(reading15.getProgress()).isEqualTo(10);
        assertThat(result.rewarded()).hasSize(1);
        assertThat(result.rewarded().get(0).rewardCurrency()).isEqualTo(50);
        verify(rewardLedger).addCurrency(account, 50, TransactionReason.DAILY_QUEST);
        verify(rewardLedger).addExperience(account, 10, TransactionReason.DAILY_QUEST);
    }

    @Test
    void 여러_세션에_걸쳐_목표에_도달하면_그때_지급한다() {
        reading15.updateProgress(10);
        todayQuests(reading15);

        QuestSessionResult result = questService.recordReadingSession(USER_ID, 300);   // 5분

        assertThat(reading15.getStatus()).isEqualTo(QuestStatus.REWARDED);
        assertThat(result.rewarded()).hasSize(1);
        verify(rewardLedger).addCurrency(account, 75, TransactionReason.DAILY_QUEST);
        verify(rewardLedger).addExperience(account, 15, TransactionReason.DAILY_QUEST);
    }

    @Test
    void 이미_보상을_받은_퀘스트는_다시_지급하지_않는다() {
        firstSession.updateProgress(1);
        firstSession.claimReward();
        todayQuests(firstSession);

        QuestSessionResult result = questService.recordReadingSession(USER_ID, 600);

        assertThat(result.rewarded()).isEmpty();
        verify(rewardLedger, never()).addCurrency(any(), anyInt(), any());
        verify(rewardLedger, never()).addExperience(any(), anyInt(), any());
    }

    @Test
    void 지난_날짜의_세션은_그날_퀘스트에만_반영하고_퀘스트를_새로_만들지_않는다() {
        when(userQuestRepository.findAllCreatedBetween(eq(USER_ID), any(), any())).thenReturn(List.of());

        QuestSessionResult result = questService.recordReadingSession(USER_ID, 600, LocalDate.now().minusDays(1));

        assertThat(result.quests()).isEmpty();
        verify(questRepository, never()).findAllByTypeOrderByIdAsc(any());
        verify(userQuestRepository, never()).saveAll(any());
    }

    private void todayQuests(UserQuest... quests) {
        when(userQuestRepository.findAllCreatedBetween(eq(USER_ID), any(), any())).thenReturn(List.of(quests));
    }

    private static UserQuest userQuest(DailyQuest dailyQuest) {
        return UserQuest.builder().userId(USER_ID).quest(dailyQuest.toEntity()).build();
    }
}
