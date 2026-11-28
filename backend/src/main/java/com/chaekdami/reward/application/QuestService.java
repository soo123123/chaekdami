package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.DailyQuest;
import com.chaekdami.reward.domain.DailyQuestPicker;
import com.chaekdami.reward.domain.Quest;
import com.chaekdami.reward.domain.QuestStatus;
import com.chaekdami.reward.domain.QuestType;
import com.chaekdami.reward.domain.RankingWeek;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.TransactionReason;
import com.chaekdami.reward.domain.UserQuest;
import com.chaekdami.reward.domain.WeeklyQuest;
import com.chaekdami.reward.infrastructure.QuestRepository;
import com.chaekdami.reward.infrastructure.UserQuestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Supplier;
import java.util.stream.Stream;

/**
 * 일일/주간 퀘스트 조회(온디맨드 생성), 독서 세션 진행도 반영, 보상 수령
 * 오늘의 일일 퀘스트는 사용자가 그날 처음 조회할 때 사용자마다 따로 뽑는다. (DailyQuestPicker)
 * 주간 퀘스트는 그 주에 처음 조회하거나 독서 완료 보상을 받을 때 WeeklyQuest 전부를 만든다.
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
     * 지금 진행할 퀘스트 목록. 일일 다음에 주간을 준다. 없으면 오늘의 일일, 이번 주의 주간 퀘스트를 만든다.
     */
    @Transactional
    public List<QuestResult> getTodayQuests(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        return Stream.concat(
                        getOrCreateDailyQuests(userId, now).stream(),
                        getOrCreateWeeklyQuests(userId, now).stream())
                .map(QuestResult::from)
                .toList();
    }

    /**
     * 지금 끝난 독서 세션 1회를 퀘스트 진행도에 반영한다.
     */
    @Transactional
    public QuestSessionResult recordReadingSession(Long userId, int durationSeconds) {
        return recordReadingSession(userId, durationSeconds, LocalDateTime.now());
    }

    /**
     * 세션이 끝난 날의 일일 퀘스트와 끝난 시각이 속한 주의 주간 퀘스트에 독서 세션 1회를 반영한다.
     * (독서 완료 화면이 자정을 넘겨 열려도 독서한 때를 기준으로 반영)
     * 지난 날, 지난 주는 그때 이미 만들어진 퀘스트에만 반영하고 새로 만들지 않는다.
     * 더할 값은 퀘스트마다 진행 기준(ProgressUnit)으로 정하고, 독서 시간은 30초 이상이면 1분으로 반올림한다.
     * 이번 세션으로 목표에 도달한 퀘스트는 수령 요청 없이 바로 보상 재화와 경험치를 지급한다. (COMPLETED -> REWARDED)
     */
    @Transactional
    public QuestSessionResult recordReadingSession(Long userId, int durationSeconds, LocalDateTime endedAt) {
        if (durationSeconds < 0) {
            throw new IllegalArgumentException("독서 시간은 0 이상이어야 합니다. (입력: " + durationSeconds + ")");
        }
        RewardAccount account = rewardLedger.lockAccount(userId);
        int readingMinutes = (durationSeconds + SECONDS_PER_MINUTE / 2) / SECONDS_PER_MINUTE;

        LocalDateTime now = LocalDateTime.now();
        List<UserQuest> userQuests = new ArrayList<>();
        userQuests.addAll(endedAt.toLocalDate().equals(now.toLocalDate())
                ? getOrCreateDailyQuests(userId, now)
                : findDailyQuests(userId, endedAt));
        userQuests.addAll(weekOf(endedAt).equals(weekOf(now))
                ? getOrCreateWeeklyQuests(userId, now)
                : findWeeklyQuests(userId, endedAt));

        List<QuestRewardResult> rewarded = new ArrayList<>();
        for (UserQuest userQuest : userQuests) {
            int progress = progressUnitOf(userQuest.getQuest())
                    .map(unit -> switch (unit) {
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
        List<QuestResult> quests = userQuests.stream()
                .map(QuestResult::from)
                .toList();
        return new QuestSessionResult(quests, rewarded);
    }

    private static Optional<DailyQuest.ProgressUnit> progressUnitOf(Quest quest) {
        return quest.getType() == QuestType.WEEKLY
                ? WeeklyQuest.fromCode(quest.getCode()).map(WeeklyQuest::getProgressUnit)
                : DailyQuest.fromCode(quest.getCode()).map(DailyQuest::getProgressUnit);
    }

    /**
     * 퀘스트를 수령 처리하고 보상 재화와 경험치를 지급한다. 경험치로 레벨업하면 승급 보상도 함께 지급된다.
     * 이력에 user_quests.id 를 남겨 어떤 퀘스트의 보상인지 구분한다.
     */
    private QuestRewardResult grantReward(RewardAccount account, UserQuest userQuest) {
        userQuest.claimReward();

        Quest quest = userQuest.getQuest();
        if (quest.getRewardCurrency() > 0) {
            rewardLedger.addCurrencyFor(
                    account, quest.getRewardCurrency(), TransactionReason.DAILY_QUEST, userQuest.getId());
        }
        int promotionReward = 0;
        if (quest.getRewardExperience() > 0) {
            promotionReward = rewardLedger.addExperienceFor(
                    account, quest.getRewardExperience(), TransactionReason.DAILY_QUEST, userQuest.getId());
        }
        return new QuestRewardResult(userQuest.getId(), quest.getRewardCurrency(), quest.getRewardExperience(),
                promotionReward, account.getCurrency(), account.getLevel());
    }

    private List<UserQuest> getOrCreateDailyQuests(Long userId, LocalDateTime now) {
        return getOrCreate(userId, "일일", () -> findDailyQuests(userId, now), () -> DailyQuestPicker.pick(
                questRepository.findAllByTypeOrderByIdAsc(QuestType.DAILY),
                DailyQuest.DAILY_QUEST_COUNT, ThreadLocalRandom.current()));
    }

    private List<UserQuest> getOrCreateWeeklyQuests(Long userId, LocalDateTime now) {
        return getOrCreate(userId, "주간", () -> findWeeklyQuests(userId, now), () -> questRepository
                .findAllByTypeOrderByIdAsc(QuestType.WEEKLY).stream()
                .filter(quest -> WeeklyQuest.fromCode(quest.getCode()).isPresent())
                .toList());
    }

    /**
     * 퀘스트가 없으면 보상 계정을 잠근 뒤 다시 확인하고 만든다. (동시 첫 호출의 중복 생성 방지)
     */
    private List<UserQuest> getOrCreate(Long userId, String label, Supplier<List<UserQuest>> finder,
                                        Supplier<List<Quest>> picker) {
        List<UserQuest> found = finder.get();
        if (!found.isEmpty()) {
            return found;
        }
        rewardLedger.lockAccount(userId);
        found = finder.get();
        if (!found.isEmpty()) {
            return found;
        }
        List<UserQuest> created = picker.get().stream()
                .map(quest -> UserQuest.builder().userId(userId).quest(quest).build())
                .toList();
        log.debug("userId={} {} 퀘스트 {}건 생성", userId, label, created.size());
        return userQuestRepository.saveAll(created);
    }

    private List<UserQuest> findDailyQuests(Long userId, LocalDateTime moment) {
        LocalDateTime start = moment.toLocalDate().atStartOfDay();
        return userQuestRepository.findAllByTypeCreatedBetween(userId, QuestType.DAILY, start, start.plusDays(1));
    }

    private List<UserQuest> findWeeklyQuests(Long userId, LocalDateTime moment) {
        RankingWeek week = weekOf(moment);
        ZoneId serverZone = ZoneId.systemDefault();
        return userQuestRepository.findAllByTypeCreatedBetween(
                userId, QuestType.WEEKLY, week.startAt(serverZone), week.endAt(serverZone));
    }

    /**
     * 서버 시각이 속한 주 (한국 시간 월요일 시작, 주간 랭킹과 같음)
     */
    private static RankingWeek weekOf(LocalDateTime serverTime) {
        return RankingWeek.containing(serverTime.atZone(ZoneId.systemDefault()));
    }
}
