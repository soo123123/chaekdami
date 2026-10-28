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
 * quests 테이블이 비어 있을 때만 일일 퀘스트 마스터 데이터를 넣는다. (재기동 시 중복 INSERT 없음)
 * DailyQuest 는 퀘스트 id 로 진행 기준을 판단하므로, 기동할 때마다 DB 의 id 와 enum 의 questId 가 맞는지 확인한다.
 * 테이블을 비울 때는 id 시퀀스도 함께 초기화해야 한다. (PostgreSQL: TRUNCATE quests RESTART IDENTITY)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DailyQuestSeeder implements ApplicationRunner {

    private final QuestRepository questRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (questRepository.count() == 0) {
            for (DailyQuest dailyQuest : DailyQuest.values()) {
                questRepository.save(dailyQuest.toEntity());
            }
            log.info("일일 퀘스트 시드 데이터 {}건 저장", DailyQuest.values().length);
        }
        verifyQuestIds();
    }

    private void verifyQuestIds() {
        for (DailyQuest dailyQuest : DailyQuest.values()) {
            Quest quest = questRepository.findById(dailyQuest.getQuestId()).orElse(null);
            if (quest == null || !dailyQuest.getTitle().equals(quest.getTitle())) {
                log.warn("일일 퀘스트 id 불일치: {} 는 id={} 여야 하지만 DB 의 해당 id 는 {} 입니다.",
                        dailyQuest, dailyQuest.getQuestId(), quest == null ? "없음" : "'" + quest.getTitle() + "'");
            }
        }
    }
}
