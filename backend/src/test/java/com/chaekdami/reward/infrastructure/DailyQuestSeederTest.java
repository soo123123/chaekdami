package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.DailyQuest;
import com.chaekdami.reward.domain.Quest;
import com.chaekdami.reward.domain.QuestType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DailyQuestSeederTest {

    @Mock
    private QuestRepository questRepository;
    @InjectMocks
    private DailyQuestSeeder seeder;

    @Test
    void 빈_테이블이면_목록의_퀘스트를_코드와_함께_모두_추가한다() {
        when(questRepository.findByCode(anyString())).thenReturn(Optional.empty());
        when(questRepository.findFirstByCodeIsNullAndTitleOrderByIdAsc(anyString())).thenReturn(Optional.empty());

        seeder.run(null);

        ArgumentCaptor<Quest> saved = ArgumentCaptor.forClass(Quest.class);
        verify(questRepository, times(DailyQuest.values().length)).save(saved.capture());
        assertThat(saved.getAllValues()).extracting(Quest::getCode)
                .containsExactly("FIRST_READING_SESSION", "READING_15_MINUTES", "READING_30_MINUTES");
    }

    @Test
    void 코드_없는_기존_행은_제목으로_찾아_코드를_채운다() {
        Quest legacy = Quest.builder().type(QuestType.DAILY).title("오늘 독서 15분 달성하기")
                .targetValue(15).rewardCurrency(75).rewardExperience(15).build();
        lenient().when(questRepository.findByCode(anyString())).thenReturn(Optional.empty());
        lenient().when(questRepository.findFirstByCodeIsNullAndTitleOrderByIdAsc(anyString())).thenReturn(Optional.empty());
        when(questRepository.findFirstByCodeIsNullAndTitleOrderByIdAsc("오늘 독서 15분 달성하기"))
                .thenReturn(Optional.of(legacy));

        seeder.run(null);

        assertThat(legacy.getCode()).isEqualTo("READING_15_MINUTES");
        verify(questRepository, times(DailyQuest.values().length - 1)).save(any());
    }

    @Test
    void 목록의_값이_바뀌면_기존_행에_반영하고_새로_추가하지_않는다() {
        Quest outdated = Quest.builder().code("READING_30_MINUTES").type(QuestType.DAILY).title("예전 제목")
                .targetValue(25).rewardCurrency(10).rewardExperience(5).build();
        lenient().when(questRepository.findByCode(anyString()))
                .thenAnswer(invocation -> Optional.of(DailyQuest.valueOf(invocation.getArgument(0)).toEntity()));
        when(questRepository.findByCode("READING_30_MINUTES")).thenReturn(Optional.of(outdated));

        seeder.run(null);

        assertThat(outdated.getTitle()).isEqualTo("오늘 독서 30분 달성하기");
        assertThat(outdated.getTargetValue()).isEqualTo(30);
        assertThat(outdated.getRewardCurrency()).isEqualTo(100);
        assertThat(outdated.getRewardExperience()).isEqualTo(20);
        verify(questRepository, never()).save(any());
    }
}
