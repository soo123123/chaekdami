package com.chaekdami.reward.domain;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class DailyQuestPickerTest {

    private final List<Quest> pool = List.of(
            DailyQuest.READING_30_MINUTES.toEntity(),
            DailyQuest.FIRST_READING_SESSION.toEntity(),
            DailyQuest.READING_15_MINUTES.toEntity()
    );

    @Test
    void 등록된_퀘스트가_출제_수_이하면_전부_선언_순서로_출제한다() {
        List<Quest> picked = DailyQuestPicker.pick(pool, DailyQuest.DAILY_QUEST_COUNT, new Random(1));

        assertThat(codes(picked)).containsExactly(
                "FIRST_READING_SESSION", "READING_15_MINUTES", "READING_30_MINUTES");
    }

    @Test
    void 항상_출제_퀘스트는_빠지지_않고_남은_칸은_랜덤으로_채운다() {
        Set<String> randomPicks = new HashSet<>();
        Random random = new Random(42);
        for (int day = 0; day < 50; day++) {
            List<Quest> picked = DailyQuestPicker.pick(pool, 2, random);

            assertThat(picked).hasSize(2);
            assertThat(codes(picked).get(0)).isEqualTo("FIRST_READING_SESSION");
            randomPicks.add(codes(picked).get(1));
        }
        assertThat(randomPicks).containsExactlyInAnyOrder("READING_15_MINUTES", "READING_30_MINUTES");
    }

    @Test
    void 목록에_없는_코드나_코드_없는_행은_출제하지_않는다() {
        Quest removed = Quest.builder().code("REMOVED_QUEST").type(QuestType.DAILY).title("지운 퀘스트").targetValue(1).build();
        Quest legacy = Quest.builder().type(QuestType.DAILY).title("코드 없는 행").targetValue(1).build();

        List<Quest> picked = DailyQuestPicker.pick(List.of(removed, legacy, pool.get(1)), 3, new Random(1));

        assertThat(codes(picked)).containsExactly("FIRST_READING_SESSION");
    }

    private static List<String> codes(List<Quest> quests) {
        return quests.stream().map(Quest::getCode).toList();
    }
}
