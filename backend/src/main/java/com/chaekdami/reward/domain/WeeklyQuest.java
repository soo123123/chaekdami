package com.chaekdami.reward.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.Optional;

/**
 * 주간 퀘스트 목록. 매주 전부 출제한다. 퀘스트를 추가/수정할 때는 여기만 고치면 된다.
 * - 상수 이름이 quests.code 로 저장되고, 앱이 시작될 때 WeeklyQuestSeeder 가 DB 를 이 목록에 맞춘다.
 * - 상수를 지우면 그 퀘스트는 더 이상 출제되지 않는다. (기존 기록 보존을 위해 DB 행은 남긴다)
 * - 이미 저장된 퀘스트의 상수 이름(코드)은 바꾸지 않는다. 바꾸면 다른 퀘스트로 취급된다.
 * - DailyQuest 의 상수 이름과 겹치지 않게 짓는다. (quests.code 는 유일)
 */
@Getter
@RequiredArgsConstructor
public enum WeeklyQuest {

    WEEKLY_SESSION_5("이번 주 독서 5번 하기", DailyQuest.ProgressUnit.SESSION_COUNT, 5, 150, 30),
    WEEKLY_READING_100_MINUTES("이번 주 100분 독서하기", DailyQuest.ProgressUnit.READING_MINUTES, 100, 200, 40),
    WEEKLY_READING_200_MINUTES("이번 주 200분 독서하기", DailyQuest.ProgressUnit.READING_MINUTES, 200, 300, 60);

    private final String title;
    private final DailyQuest.ProgressUnit progressUnit;
    private final int targetValue;
    private final int rewardCurrency;
    private final int rewardExperience;

    public String getCode() {
        return name();
    }

    public static Optional<WeeklyQuest> fromCode(String code) {
        return Arrays.stream(values())
                .filter(quest -> quest.name().equals(code))
                .findFirst();
    }

    public Quest toEntity() {
        return Quest.builder()
                .code(getCode())
                .type(QuestType.WEEKLY)
                .title(title)
                .targetValue(targetValue)
                .rewardCurrency(rewardCurrency)
                .rewardExperience(rewardExperience)
                .build();
    }

    /**
     * DB 의 퀘스트 정의를 이 상수의 값으로 맞춘다.
     *
     * @return 바뀐 값이 있으면 true
     */
    public boolean applyTo(Quest quest) {
        return quest.changeDefinition(QuestType.WEEKLY, title, targetValue, rewardCurrency, rewardExperience);
    }
}
