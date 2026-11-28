package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.Quest;
import com.chaekdami.reward.domain.QuestType;
import com.chaekdami.reward.domain.WeeklyQuest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WeeklyQuestSeederTest {

    @Mock
    private QuestRepository questRepository;
    @InjectMocks
    private WeeklyQuestSeeder seeder;

    @Test
    void 빈_테이블이면_주간_퀘스트를_모두_추가한다() {
        when(questRepository.findByCode(anyString())).thenReturn(Optional.empty());

        seeder.run(null);

        ArgumentCaptor<Quest> saved = ArgumentCaptor.forClass(Quest.class);
        verify(questRepository, times(3)).save(saved.capture());
        assertThat(saved.getAllValues())
                .extracting(Quest::getCode, Quest::getType, Quest::getTitle, Quest::getTargetValue,
                        Quest::getRewardCurrency, Quest::getRewardExperience)
                .containsExactly(
                        tuple("WEEKLY_SESSION_5", QuestType.WEEKLY, "이번 주 독서 5번 하기", 5, 150, 30),
                        tuple("WEEKLY_READING_100_MINUTES", QuestType.WEEKLY, "이번 주 100분 독서하기", 100, 200, 40),
                        tuple("WEEKLY_READING_200_MINUTES", QuestType.WEEKLY, "이번 주 200분 독서하기", 200, 300, 60));
    }

    @Test
    void 목록의_값이_바뀌면_기존_행에_반영하고_새로_추가하지_않는다() {
        Quest outdated = Quest.builder().code("WEEKLY_SESSION_5").type(QuestType.WEEKLY).title("예전 제목")
                .targetValue(3).rewardCurrency(10).rewardExperience(5).build();
        lenient().when(questRepository.findByCode(anyString()))
                .thenAnswer(invocation -> Optional.of(WeeklyQuest.valueOf(invocation.getArgument(0)).toEntity()));
        when(questRepository.findByCode("WEEKLY_SESSION_5")).thenReturn(Optional.of(outdated));

        seeder.run(null);

        assertThat(outdated.getTitle()).isEqualTo("이번 주 독서 5번 하기");
        assertThat(outdated.getTargetValue()).isEqualTo(5);
        assertThat(outdated.getRewardCurrency()).isEqualTo(150);
        assertThat(outdated.getRewardExperience()).isEqualTo(30);
        verify(questRepository, never()).save(any());
    }

    @Test
    void 제목에_30분이_들어가지_않는다() {
        // 앱 마이페이지가 제목에 "30분" 이 들어간 첫 퀘스트를 일일 30분 퀘스트로 찾는다.
        assertThat(WeeklyQuest.values()).noneMatch(quest -> quest.getTitle().contains("30분"));
    }
}
