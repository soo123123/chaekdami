package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.DailyQuest;
import com.chaekdami.reward.domain.Quest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 앱이 시작될 때 quests 테이블을 DailyQuest 목록에 맞춘다.
 * - 목록에 새로 생긴 퀘스트는 추가한다.
 * - code 컬럼이 생기기 전에 만들어진 행은 제목으로 찾아 코드를 채운다.
 * - 목록에서 제목/목표/보상을 바꾸면 DB 에도 반영한다.
 * 목록에서 지운 퀘스트의 행은 기존 user_quests 기록 보존을 위해 지우지 않고, 출제에서만 빠진다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DailyQuestSeeder implements ApplicationRunner {

    private final QuestRepository questRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int inserted = 0;
        int updated = 0;
        for (DailyQuest dailyQuest : DailyQuest.values()) {
            Quest quest = questRepository.findByCode(dailyQuest.getCode())
                    .or(() -> questRepository.findFirstByCodeIsNullAndTitleOrderByIdAsc(dailyQuest.getTitle()))
                    .orElse(null);
            if (quest == null) {
                questRepository.save(dailyQuest.toEntity());
                inserted++;
                continue;
            }
            boolean changed = quest.getCode() == null;
            quest.assignCode(dailyQuest.getCode());
            if (dailyQuest.applyTo(quest) || changed) {
                updated++;
            }
        }
        if (inserted > 0 || updated > 0) {
            log.info("일일 퀘스트 목록 동기화: 추가 {}건, 갱신 {}건", inserted, updated);
        }
    }
}
