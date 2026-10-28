package com.chaekdami.reward.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.Optional;

/**
 * 일일 퀘스트 시드 데이터와 퀘스트 id 별 진행도 계산 기준.
 * quests 테이블에 진행 기준 컬럼이 없으므로, 퀘스트 id 로 무엇을 셀지 판단한다.
 * questId 는 빈 quests 테이블에 선언 순서대로 INSERT 했을 때 부여되는 id 다.
 */
@Getter
@RequiredArgsConstructor
public enum DailyQuest {

    FIRST_READING_SESSION(1L, "오늘의 첫 독서 세션 시작하기", ProgressUnit.SESSION_COUNT, 1, 50, 10),
    READING_15_MINUTES(2L, "오늘 독서 15분 달성하기", ProgressUnit.READING_MINUTES, 15, 75, 15),
    READING_30_MINUTES(3L, "오늘 독서 30분 달성하기", ProgressUnit.READING_MINUTES, 30, 100, 20);

    private final Long questId;
    private final String title;
    private final ProgressUnit progressUnit;
    private final int targetValue;
    private final int rewardCurrency;
    private final int rewardExperience;

    public static Optional<DailyQuest> fromQuestId(Long questId) {
        return Arrays.stream(values())
                .filter(quest -> quest.questId.equals(questId))
                .findFirst();
    }

    public Quest toEntity() {
        return Quest.builder()
                .type(QuestType.DAILY)
                .title(title)
                .targetValue(targetValue)
                .rewardCurrency(rewardCurrency)
                .rewardExperience(rewardExperience)
                .build();
    }

    public enum ProgressUnit {
        /** 독서 세션 1회 완료당 +1 */
        SESSION_COUNT,
        /** 독서 시간(분)만큼 + */
        READING_MINUTES
    }
}
