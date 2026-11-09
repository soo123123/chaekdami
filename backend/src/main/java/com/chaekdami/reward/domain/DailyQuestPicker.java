package com.chaekdami.reward.domain;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Random;

/**
 * 출제 가능한 일일 퀘스트 중 오늘 출제할 퀘스트를 고른다.
 * - DailyQuest 에 없는 코드(목록에서 지운 퀘스트, 코드 없는 행)는 출제하지 않는다.
 * - alwaysIncluded 퀘스트는 항상 넣고, 남은 칸은 나머지 퀘스트 중에서 랜덤으로 채운다.
 * - 결과는 DailyQuest 선언 순서로 정렬한다.
 */
public final class DailyQuestPicker {

    private DailyQuestPicker() {
    }

    public static List<Quest> pick(List<Quest> pool, int count, Random random) {
        List<Quest> always = new ArrayList<>();
        List<Quest> candidates = new ArrayList<>();
        for (Quest quest : pool) {
            DailyQuest.fromCode(quest.getCode()).ifPresent(dailyQuest -> {
                if (dailyQuest.isAlwaysIncluded()) {
                    always.add(quest);
                } else {
                    candidates.add(quest);
                }
            });
        }

        Collections.shuffle(candidates, random);
        List<Quest> picked = new ArrayList<>(always);
        int remaining = Math.max(0, count - always.size());
        picked.addAll(candidates.subList(0, Math.min(remaining, candidates.size())));

        picked.sort(Comparator.comparing(quest -> DailyQuest.fromCode(quest.getCode()).orElseThrow().ordinal()));
        return picked;
    }
}
