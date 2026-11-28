package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.DailyQuest;
import com.chaekdami.reward.domain.Quest;
import com.chaekdami.reward.domain.QuestStatus;
import com.chaekdami.reward.domain.QuestType;
import com.chaekdami.reward.domain.RankingWeek;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.TransactionReason;
import com.chaekdami.reward.domain.UserQuest;
import com.chaekdami.reward.domain.WeeklyQuest;
import com.chaekdami.reward.infrastructure.QuestRepository;
import com.chaekdami.reward.infrastructure.UserQuestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
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
    private final UserQuest firstSession = userQuest(1L, DailyQuest.FIRST_READING_SESSION.toEntity());
    private final UserQuest reading15 = userQuest(2L, DailyQuest.READING_15_MINUTES.toEntity());
    private final UserQuest weeklySession5 = userQuest(3L, WeeklyQuest.WEEKLY_SESSION_5.toEntity());
    private final UserQuest weekly100 = userQuest(4L, WeeklyQuest.WEEKLY_READING_100_MINUTES.toEntity());

    @BeforeEach
    void setUp() {
        lenient().when(rewardLedger.lockAccount(USER_ID)).thenReturn(account);
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
        verify(rewardLedger).addCurrencyFor(account, 50, TransactionReason.DAILY_QUEST, 1L);
        verify(rewardLedger).addExperienceFor(account, 10, TransactionReason.DAILY_QUEST, 1L);
    }

    @Test
    void 여러_세션에_걸쳐_목표에_도달하면_그때_지급한다() {
        reading15.updateProgress(10);
        todayQuests(reading15);

        QuestSessionResult result = questService.recordReadingSession(USER_ID, 300);   // 5분

        assertThat(reading15.getStatus()).isEqualTo(QuestStatus.REWARDED);
        assertThat(result.rewarded()).hasSize(1);
        verify(rewardLedger).addCurrencyFor(account, 75, TransactionReason.DAILY_QUEST, 2L);
        verify(rewardLedger).addExperienceFor(account, 15, TransactionReason.DAILY_QUEST, 2L);
    }

    @Test
    void 이미_보상을_받은_퀘스트는_다시_지급하지_않는다() {
        firstSession.updateProgress(1);
        firstSession.claimReward();
        todayQuests(firstSession);

        QuestSessionResult result = questService.recordReadingSession(USER_ID, 600);

        assertThat(result.rewarded()).isEmpty();
        verify(rewardLedger, never()).addCurrencyFor(any(), anyInt(), any(), any());
        verify(rewardLedger, never()).addExperienceFor(any(), anyInt(), any(), any());
    }

    @Test
    void 지난_주의_세션은_그때의_퀘스트에만_반영하고_일일도_주간도_새로_만들지_않는다() {
        QuestSessionResult result = questService.recordReadingSession(USER_ID, 600, LocalDateTime.now().minusDays(8));

        assertThat(result.quests()).isEmpty();
        verify(questRepository, never()).findAllByTypeOrderByIdAsc(any());
        verify(userQuestRepository, never()).saveAll(any());
    }

    @Test
    void 한_세션이_일일과_주간에_함께_반영되고_주간도_달성하면_바로_지급한다() {
        weeklySession5.updateProgress(4);
        todayQuests(firstSession);
        quests(QuestType.WEEKLY, weeklySession5, weekly100);

        QuestSessionResult result = questService.recordReadingSession(USER_ID, 630);   // 10분 30초 -> 11분

        assertThat(weeklySession5.getStatus()).isEqualTo(QuestStatus.REWARDED);
        assertThat(weekly100.getProgress()).isEqualTo(11);
        assertThat(result.rewarded()).extracting(QuestRewardResult::userQuestId).containsExactly(1L, 3L);
        verify(rewardLedger).addCurrencyFor(account, 150, TransactionReason.DAILY_QUEST, 3L);
        verify(rewardLedger).addExperienceFor(account, 30, TransactionReason.DAILY_QUEST, 3L);
    }

    @Test
    void 목록은_일일_다음에_주간을_준다() {
        todayQuests(firstSession, reading15);
        quests(QuestType.WEEKLY, weeklySession5, weekly100);

        assertThat(questService.getTodayQuests(USER_ID)).extracting(QuestResult::userQuestId)
                .containsExactly(1L, 2L, 3L, 4L);
    }

    @Test
    void 일일만_있으면_주간만_만들고_목록에서_빠진_주간은_출제하지_않는다() {
        Quest removed = Quest.builder().code("WEEKLY_REMOVED").type(QuestType.WEEKLY).title("없어진 퀘스트")
                .targetValue(1).rewardCurrency(1).rewardExperience(1).build();
        todayQuests(firstSession);
        when(questRepository.findAllByTypeOrderByIdAsc(QuestType.WEEKLY))
                .thenReturn(List.of(WeeklyQuest.WEEKLY_SESSION_5.toEntity(), removed));
        when(userQuestRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(questService.getTodayQuests(USER_ID)).extracting(QuestResult::title)
                .containsExactly(firstSession.getQuest().getTitle(), "이번 주 독서 5번 하기");
        verify(questRepository, never()).findAllByTypeOrderByIdAsc(QuestType.DAILY);
    }

    @Test
    void 지난_주_세션은_지난_주에_만들어진_주간_퀘스트에_반영한다() {
        LocalDateTime endedAt = LocalDateTime.now().minusDays(8);
        RankingWeek week = RankingWeek.containing(endedAt.atZone(ZoneId.systemDefault()));
        lenient().when(userQuestRepository.findAllByTypeCreatedBetween(USER_ID, QuestType.WEEKLY,
                week.startAt(ZoneId.systemDefault()), week.endAt(ZoneId.systemDefault())))
                .thenReturn(List.of(weekly100));

        questService.recordReadingSession(USER_ID, 600, endedAt);

        assertThat(weekly100.getProgress()).isEqualTo(10);
        verify(userQuestRepository, never()).saveAll(any());
    }

    private void todayQuests(UserQuest... quests) {
        quests(QuestType.DAILY, quests);
    }

    private void quests(QuestType type, UserQuest... quests) {
        lenient().when(userQuestRepository.findAllByTypeCreatedBetween(eq(USER_ID), eq(type), any(), any()))
                .thenReturn(List.of(quests));
    }

    private static UserQuest userQuest(Long id, Quest quest) {
        UserQuest userQuest = UserQuest.builder().userId(USER_ID).quest(quest).build();
        ReflectionTestUtils.setField(userQuest, "id", id);
        return userQuest;
    }
}
