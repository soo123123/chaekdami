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
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DailyQuestSeeder implements ApplicationRunner {

    private final QuestRepository questRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (questRepository.count() > 0) {
            return;
        }
        for (DailyQuest dailyQuest : DailyQuest.values()) {
            Quest saved = questRepository.save(dailyQuest.toEntity());
            if (!dailyQuest.getQuestId().equals(saved.getId())) {
                log.warn("일일 퀘스트 id 불일치: {} 예상 id={}, 실제 id={}",
                        dailyQuest, dailyQuest.getQuestId(), saved.getId());
            }
        }
        log.info("일일 퀘스트 시드 데이터 {}건 저장", DailyQuest.values().length);
    }
}
