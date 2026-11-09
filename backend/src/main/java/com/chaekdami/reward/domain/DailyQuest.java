package com.chaekdami.reward.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.Optional;

/**
 * 일일 퀘스트 목록. 퀘스트를 추가/수정할 때는 여기만 고치면 된다.
 * - 상수 이름이 quests.code 로 저장되고, 앱이 시작될 때 DailyQuestSeeder 가 DB 를 이 목록에 맞춘다.
 * - 새 퀘스트는 상수를 한 줄 추가하면 된다. 진행 기준(ProgressUnit)이 새로 필요하면 QuestService 의 진행도 계산도 함께 고친다.
 * - 상수를 지우면 그 퀘스트는 더 이상 출제되지 않는다. (기존 기록 보존을 위해 DB 행은 남긴다)
 * - 이미 저장된 퀘스트의 상수 이름(코드)은 바꾸지 않는다. 바꾸면 다른 퀘스트로 취급된다.
 */
@Getter
@RequiredArgsConstructor
public enum DailyQuest {

    FIRST_READING_SESSION("오늘의 첫 독서 세션 시작하기", ProgressUnit.SESSION_COUNT, 1, 50, 10, true),
    READING_15_MINUTES("오늘 독서 15분 달성하기", ProgressUnit.READING_MINUTES, 15, 75, 15, false),
    READING_30_MINUTES("오늘 독서 30분 달성하기", ProgressUnit.READING_MINUTES, 30, 100, 20, false);

    /** 하루에 출제하는 일일 퀘스트 수. 등록된 퀘스트가 이보다 적으면 전부 출제한다. */
    public static final int DAILY_QUEST_COUNT = 3;

    private final String title;
    private final ProgressUnit progressUnit;
    private final int targetValue;
    private final int rewardCurrency;
    private final int rewardExperience;
    /** true 면 랜덤 추첨과 관계없이 매일 출제한다. */
    private final boolean alwaysIncluded;

    public String getCode() {
        return name();
    }

    public static Optional<DailyQuest> fromCode(String code) {
        return Arrays.stream(values())
                .filter(quest -> quest.name().equals(code))
                .findFirst();
    }

    public Quest toEntity() {
        return Quest.builder()
                .code(getCode())
                .type(QuestType.DAILY)
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
        return quest.changeDefinition(QuestType.DAILY, title, targetValue, rewardCurrency, rewardExperience);
    }

    public enum ProgressUnit {
        /** 독서 세션 1회 완료당 +1 */
        SESSION_COUNT,
        /** 독서 시간(분)만큼 + */
        READING_MINUTES
    }
}
