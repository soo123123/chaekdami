package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.DailyQuest;
import com.chaekdami.reward.domain.DailyQuestPicker;
import com.chaekdami.reward.domain.Quest;
import com.chaekdami.reward.domain.QuestStatus;
import com.chaekdami.reward.domain.QuestType;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.TransactionReason;
import com.chaekdami.reward.domain.UserQuest;
import com.chaekdami.reward.infrastructure.QuestRepository;
import com.chaekdami.reward.infrastructure.UserQuestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 오늘의 퀘스트 조회(온디맨드 생성), 독서 세션 진행도 반영, 보상 수령
 * 오늘의 일일 퀘스트는 사용자가 그날 처음 조회할 때 사용자마다 따로 뽑는다. (DailyQuestPicker)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuestService {

    private static final int SECONDS_PER_MINUTE = 60;

    private final QuestRepository questRepository;
    private final UserQuestRepository userQuestRepository;
    private final RewardLedger rewardLedger;

    /**
     * 오늘의 퀘스트 목록. 자정 이후 처음 호출하면 오늘 자 일일 퀘스트를 만든다.
     */
    @Transactional
    public List<QuestResult> getTodayQuests(Long userId) {
        return getOrCreateTodayQuests(userId).stream()
                .map(QuestResult::from)
                .toList();
    }

    /**
     * 독서 세션 1회 완료를 오늘의 퀘스트 진행도에 반영한다. 퀘스트마다 DailyQuest 의 진행 기준으로 더할 값을 정한다.
     * 독서 시간은 30초 이상이면 1분으로 반올림한다.
     * 이번 세션으로 목표에 도달한 퀘스트는 수령 요청 없이 바로 보상 재화와 경험치를 지급한다. (COMPLETED -> REWARDED)
     */
    @Transactional
    public QuestSessionResult recordReadingSession(Long userId, int durationSeconds) {
        return recordReadingSession(userId, durationSeconds, LocalDate.now());
    }

    /**
     * readingDate 날짜의 퀘스트에 독서 세션 1회를 반영한다. (독서 완료 화면이 자정을 넘겨 열려도 독서한 날짜로 반영)
     * 오늘이 아닌 날짜는 그날 이미 만들어진 퀘스트에만 반영한다. 지난 날짜의 퀘스트를 새로 만들지는 않는다.
     */
    @Transactional
    public QuestSessionResult recordReadingSession(Long userId, int durationSeconds, LocalDate readingDate) {
        if (durationSeconds < 0) {
            throw new IllegalArgumentException("독서 시간은 0 이상이어야 합니다. (입력: " + durationSeconds + ")");
        }
        RewardAccount account = rewardLedger.lockAccount(userId);
        int readingMinutes = (durationSeconds + SECONDS_PER_MINUTE / 2) / SECONDS_PER_MINUTE;

        List<UserQuest> todayQuests = readingDate.equals(LocalDate.now())
                ? getOrCreateTodayQuests(userId)
                : findQuestsOf(userId, readingDate);
        List<QuestRewardResult> rewarded = new ArrayList<>();
        for (UserQuest userQuest : todayQuests) {
            int progress = DailyQuest.fromCode(userQuest.getQuest().getCode())
                    .map(dailyQuest -> switch (dailyQuest.getProgressUnit()) {
                        case SESSION_COUNT -> 1;
                        case READING_MINUTES -> readingMinutes;
                    })
                    .orElse(0);
            if (progress > 0) {
                userQuest.updateProgress(progress);
            }
            if (userQuest.getStatus() == QuestStatus.COMPLETED) {
                rewarded.add(grantReward(account, userQuest));
            }
        }
        List<QuestResult> quests = todayQuests.stream()
                .map(QuestResult::from)
                .toList();
        return new QuestSessionResult(quests, rewarded);
    }

    /**
     * 퀘스트를 수령 처리하고 보상 재화와 경험치를 지급한다. 경험치로 레벨업하면 승급 보상도 함께 지급된다.
     */
    private QuestRewardResult grantReward(RewardAccount account, UserQuest userQuest) {
        userQuest.claimReward();

        Quest quest = userQuest.getQuest();
        if (quest.getRewardCurrency() > 0) {
            rewardLedger.addCurrency(account, quest.getRewardCurrency(), TransactionReason.DAILY_QUEST);
        }
        int promotionReward = 0;
        if (quest.getRewardExperience() > 0) {
            promotionReward = rewardLedger.addExperience(account, quest.getRewardExperience(), TransactionReason.DAILY_QUEST);
        }
        return new QuestRewardResult(userQuest.getId(), quest.getRewardCurrency(), quest.getRewardExperience(),
                promotionReward, account.getCurrency(), account.getLevel());
    }

    /**
     * 오늘 자 퀘스트가 없으면 보상 계정을 잠근 뒤 다시 확인하고 만든다. (동시 첫 호출의 중복 생성 방지)
     */
    private List<UserQuest> getOrCreateTodayQuests(Long userId) {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1);

        List<UserQuest> todayQuests = userQuestRepository.findAllCreatedBetween(userId, start, end);
        if (!todayQuests.isEmpty()) {
            return todayQuests;
        }
        rewardLedger.lockAccount(userId);
        todayQuests = userQuestRepository.findAllCreatedBetween(userId, start, end);
        if (!todayQuests.isEmpty()) {
            return todayQuests;
        }

        List<Quest> pool = questRepository.findAllByTypeOrderByIdAsc(QuestType.DAILY);
        List<UserQuest> created = DailyQuestPicker.pick(pool, DailyQuest.DAILY_QUEST_COUNT, ThreadLocalRandom.current())
                .stream()
                .map(quest -> UserQuest.builder().userId(userId).quest(quest).build())
                .toList();
        log.debug("userId={} 오늘의 일일 퀘스트 {}건 생성", userId, created.size());
        return userQuestRepository.saveAll(created);
    }

    private List<UserQuest> findQuestsOf(Long userId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        return userQuestRepository.findAllCreatedBetween(userId, start, start.plusDays(1));
    }
}
