package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.Quest;
import com.chaekdami.reward.domain.WeeklyQuest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 앱이 시작될 때 quests 테이블을 WeeklyQuest 목록에 맞춘다.
 * 새 퀘스트는 추가하고, 제목/목표/보상이 바뀌면 반영한다. 목록에서 지운 퀘스트의 행은 기존 기록 보존을 위해 남긴다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WeeklyQuestSeeder implements ApplicationRunner {

    private final QuestRepository questRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int inserted = 0;
        int updated = 0;
        for (WeeklyQuest weeklyQuest : WeeklyQuest.values()) {
            Quest quest = questRepository.findByCode(weeklyQuest.getCode()).orElse(null);
            if (quest == null) {
                questRepository.save(weeklyQuest.toEntity());
                inserted++;
            } else if (weeklyQuest.applyTo(quest)) {
                updated++;
            }
        }
        if (inserted > 0 || updated > 0) {
            log.info("주간 퀘스트 목록 동기화: 추가 {}건, 갱신 {}건", inserted, updated);
        }
    }
}
