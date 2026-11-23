package com.chaekdami.reward.application;

import com.chaekdami.reward.application.port.UserNicknameReader;
import com.chaekdami.reward.domain.RankingWeek;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.TransactionType;
import com.chaekdami.reward.infrastructure.RewardAccountRepository;
import com.chaekdami.reward.infrastructure.RewardTransactionRepository;
import com.chaekdami.reward.infrastructure.RewardTransactionRepository.UserAmount;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 주간 경험치 랭킹 (스펙 005). 읽기 전용이다. 보상 계정을 만들거나 방어권을 정산하지 않는다.
 *
 * 점수는 그 주에 받은 경험치(INCOME_EXPERIENCE) 합이다. 재화(승급 보상 등)는 들어가지 않는다.
 * 어느 주인지는 지급 시각(created_at)으로 정한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RankingService {

    public static final int TOP_SIZE = 30;
    private static final int DEFAULT_LEVEL = 1;
    private static final TransactionType SCORE_TYPE = TransactionType.INCOME_EXPERIENCE;

    private final RewardTransactionRepository rewardTransactionRepository;
    private final RewardAccountRepository rewardAccountRepository;
    private final UserNicknameReader userNicknameReader;

    public WeeklyRankingResult getWeeklyRanking(Long userId) {
        return getWeeklyRanking(userId, ZonedDateTime.now(), ZoneId.systemDefault());
    }

    /**
     * @param now        지금 순간 (이 순간이 속한 한국 시간 주를 쓴다)
     * @param serverZone created_at 이 저장된 시간대 (서버 기본 시간대)
     */
    WeeklyRankingResult getWeeklyRanking(Long userId, ZonedDateTime now, ZoneId serverZone) {
        RankingWeek week = RankingWeek.containing(now);
        LocalDateTime start = week.startAt(serverZone);
        LocalDateTime end = week.endAt(serverZone);

        List<UserAmount> top = rewardTransactionRepository.findTopAmounts(
                SCORE_TYPE, start, end, PageRequest.of(0, TOP_SIZE));
        int myExperience = Math.toIntExact(rewardTransactionRepository.sumAmount(userId, SCORE_TYPE, start, end));

        Set<Long> userIds = new HashSet<>();
        top.forEach(row -> userIds.add(row.getUserId()));
        userIds.add(userId);
        Map<Long, String> nicknames = userNicknameReader.findNicknames(userIds);
        Map<Long, Integer> levels = rewardAccountRepository.findAllByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(RewardAccount::getUserId, RewardAccount::getLevel, (a, b) -> a));
        Function<Long, Integer> levelOf = id -> levels.getOrDefault(id, DEFAULT_LEVEL);

        List<WeeklyRankingResult.Entry> rankings = rank(top, userId, nicknames, levelOf);

        Integer myRank = null;
        if (myExperience > 0) {
            myRank = Math.toIntExact(rewardTransactionRepository.countUsersWithAmountGreaterThan(
                    SCORE_TYPE, start, end, myExperience)) + 1;
        }
        WeeklyRankingResult.MyRanking myRanking = new WeeklyRankingResult.MyRanking(
                myRank, nicknames.get(userId), levelOf.apply(userId), myExperience);

        return new WeeklyRankingResult(week.startDate(), week.endDate(), rankings, myRanking);
    }

    /**
     * 경험치 내림차순으로 정렬된 목록에 순위를 매긴다. 같은 경험치는 같은 순위 (1, 2, 2, 4).
     * 닉네임을 찾을 수 없는 사용자(탈퇴 등)는 목록에서 뺀다. 순위는 빼기 전 기준이다.
     */
    private static List<WeeklyRankingResult.Entry> rank(List<UserAmount> top, Long userId,
                                                         Map<Long, String> nicknames,
                                                         Function<Long, Integer> levelOf) {
        List<WeeklyRankingResult.Entry> rankings = new ArrayList<>();
        int rank = 0;
        long previousAmount = -1;
        for (int i = 0; i < top.size(); i++) {
            UserAmount row = top.get(i);
            long amount = row.getAmount();
            if (amount != previousAmount) {
                rank = i + 1;
                previousAmount = amount;
            }
            String nickname = nicknames.get(row.getUserId());
            if (nickname == null) {
                continue;
            }
            rankings.add(new WeeklyRankingResult.Entry(rank, nickname, levelOf.apply(row.getUserId()),
                    Math.toIntExact(amount), row.getUserId().equals(userId)));
        }
        return rankings;
    }
}
