package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.DailyQuest;
import com.chaekdami.reward.domain.Quest;
import com.chaekdami.reward.domain.QuestType;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
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
import java.util.List;

/**
 * 오늘의 퀘스트 조회(온디맨드 생성), 독서 세션 진행도 반영, 보상 수령
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
     * 독서 시간은 30초 이상이면 1분으로 반올림한다. 독서 완료 유스케이스(CompleteReadingService)가 검증된 독서 시간으로 호출한다.
     */
    @Transactional
    public List<QuestResult> recordReadingSession(Long userId, int durationSeconds) {
        rewardLedger.lockAccount(userId);
        int readingMinutes = (durationSeconds + SECONDS_PER_MINUTE / 2) / SECONDS_PER_MINUTE;

        List<UserQuest> todayQuests = getOrCreateTodayQuests(userId);
        for (UserQuest userQuest : todayQuests) {
            int progress = DailyQuest.fromQuestId(userQuest.getQuest().getId())
                    .map(dailyQuest -> switch (dailyQuest.getProgressUnit()) {
                        case SESSION_COUNT -> 1;
                        case READING_MINUTES -> readingMinutes;
                    })
                    .orElse(0);
            if (progress > 0) {
                userQuest.updateProgress(progress);
            }
        }
        return todayQuests.stream()
                .map(QuestResult::from)
                .toList();
    }

    /**
     * 완료된 퀘스트의 보상 재화와 경험치를 지급한다.
     */
    @Transactional
    public QuestRewardResult claimReward(Long userId, Long userQuestId) {
        RewardAccount account = rewardLedger.lockAccount(userId);
        UserQuest userQuest = userQuestRepository.findByIdAndUserId(userQuestId, userId)
                .orElseThrow(() -> new RewardException(RewardErrorCode.QUEST_NOT_FOUND));
        userQuest.claimReward();

        Quest quest = userQuest.getQuest();
        if (quest.getRewardCurrency() > 0) {
            rewardLedger.addCurrency(account, quest.getRewardCurrency(), TransactionReason.DAILY_QUEST);
        }
        int promotionReward = 0;
        if (quest.getRewardExperience() > 0) {
            promotionReward = rewardLedger.addExperience(account, quest.getRewardExperience(), TransactionReason.DAILY_QUEST);
        }
        return new QuestRewardResult(userQuestId, quest.getRewardCurrency(), quest.getRewardExperience(),
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

        List<UserQuest> created = questRepository.findAllByTypeOrderByIdAsc(QuestType.DAILY).stream()
                .map(quest -> UserQuest.builder().userId(userId).quest(quest).build())
                .toList();
        log.debug("userId={} 오늘의 일일 퀘스트 {}건 생성", userId, created.size());
        return userQuestRepository.saveAll(created);
    }
}
