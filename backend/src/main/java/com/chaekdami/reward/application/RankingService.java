package com.chaekdami.reward.application;

import com.chaekdami.reward.application.port.RankingTargetChecker;
import com.chaekdami.reward.application.port.UserNicknameReader;
import com.chaekdami.reward.application.port.WeeklyReadingTimeReader;
import com.chaekdami.reward.domain.RankingWeek;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.TransactionType;
import com.chaekdami.reward.infrastructure.RewardAccountRepository;
import com.chaekdami.reward.infrastructure.RewardTransactionRepository;
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
 * 주간 랭킹 (스펙 005). 읽기 전용이다. 보상 계정을 만들거나 방어권을 정산하지 않는다.
 *
 * - 경험치 랭킹: 그 주에 받은 경험치(INCOME_EXPERIENCE) 합. 재화(승급 보상 등)는 들어가지 않는다. 지급 시각 기준.
 * - 독서 시간 랭킹: 그 주에 끝난 독서 세션의 독서 시간(초) 합. 세션 종료 시각 기준.
 * - 정지 중인 회원과 관리자는 순위에서 빠진다. 본인이 해당하면 점수만 주고 순위는 없다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RankingService {

    public static final int TOP_SIZE = 30;
    private static final int DEFAULT_LEVEL = 1;
    private static final TransactionType EXPERIENCE_TYPE = TransactionType.INCOME_EXPERIENCE;

    private final RewardTransactionRepository rewardTransactionRepository;
    private final RewardAccountRepository rewardAccountRepository;
    private final UserNicknameReader userNicknameReader;
    private final WeeklyReadingTimeReader weeklyReadingTimeReader;
    private final RankingTargetChecker rankingTargetChecker;

    public WeeklyRankingResult getWeeklyExperienceRanking(Long userId) {
        return getWeeklyExperienceRanking(userId, ZonedDateTime.now(), ZoneId.systemDefault());
    }

    public WeeklyRankingResult getWeeklyReadingTimeRanking(Long userId) {
        return getWeeklyReadingTimeRanking(userId, ZonedDateTime.now(), ZoneId.systemDefault());
    }

    /**
     * @param now        지금 순간 (이 순간이 속한 한국 시간 주를 쓴다)
     * @param serverZone 시각 컬럼이 저장된 시간대 (서버 기본 시간대)
     */
    WeeklyRankingResult getWeeklyExperienceRanking(Long userId, ZonedDateTime now, ZoneId serverZone) {
        return rank(userId, now, serverZone, experienceScores());
    }

    WeeklyRankingResult getWeeklyReadingTimeRanking(Long userId, ZonedDateTime now, ZoneId serverZone) {
        return rank(userId, now, serverZone, readingTimeScores());
    }

    private ScoreSource experienceScores() {
        return new ScoreSource() {
            @Override
            public List<UserScore> top(LocalDateTime start, LocalDateTime end, LocalDateTime now) {
                return rewardTransactionRepository
                        .findTopAmounts(EXPERIENCE_TYPE, start, end, now, PageRequest.of(0, TOP_SIZE)).stream()
                        .map(row -> new UserScore(row.getUserId(), row.getAmount()))
                        .toList();
            }

            @Override
            public long sumOf(Long userId, LocalDateTime start, LocalDateTime end) {
                return rewardTransactionRepository.sumAmount(userId, EXPERIENCE_TYPE, start, end);
            }

            @Override
            public long countGreaterThan(LocalDateTime start, LocalDateTime end, LocalDateTime now, long score) {
                return rewardTransactionRepository
                        .countUsersWithAmountGreaterThan(EXPERIENCE_TYPE, start, end, now, score);
            }
        };
    }

    private ScoreSource readingTimeScores() {
        return new ScoreSource() {
            @Override
            public List<UserScore> top(LocalDateTime start, LocalDateTime end, LocalDateTime now) {
                return weeklyReadingTimeReader.findTop(start, end, now, TOP_SIZE).stream()
                        .map(row -> new UserScore(row.userId(), row.seconds()))
                        .toList();
            }

            @Override
            public long sumOf(Long userId, LocalDateTime start, LocalDateTime end) {
                return weeklyReadingTimeReader.sumOf(userId, start, end);
            }

            @Override
            public long countGreaterThan(LocalDateTime start, LocalDateTime end, LocalDateTime now, long score) {
                return weeklyReadingTimeReader.countUsersGreaterThan(start, end, now, score);
            }
        };
    }

    private WeeklyRankingResult rank(Long userId, ZonedDateTime now, ZoneId serverZone, ScoreSource scores) {
        RankingWeek week = RankingWeek.containing(now);
        LocalDateTime start = week.startAt(serverZone);
        LocalDateTime end = week.endAt(serverZone);
        LocalDateTime serverNow = now.withZoneSameInstant(serverZone).toLocalDateTime();

        List<UserScore> top = scores.top(start, end, serverNow);
        long myScore = scores.sumOf(userId, start, end);

        Set<Long> userIds = new HashSet<>();
        top.forEach(row -> userIds.add(row.userId()));
        userIds.add(userId);
        Map<Long, String> nicknames = userNicknameReader.findNicknames(userIds);
        Map<Long, Integer> levels = rewardAccountRepository.findAllByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(RewardAccount::getUserId, RewardAccount::getLevel, (a, b) -> a));
        Function<Long, Integer> levelOf = id -> levels.getOrDefault(id, DEFAULT_LEVEL);

        List<WeeklyRankingResult.Entry> rankings = toEntries(top, userId, nicknames, levelOf);

        Integer myRank = null;
        if (myScore > 0 && rankingTargetChecker.isTarget(userId, serverNow)) {
            myRank = Math.toIntExact(scores.countGreaterThan(start, end, serverNow, myScore)) + 1;
        }
        WeeklyRankingResult.MyRanking myRanking = new WeeklyRankingResult.MyRanking(
                myRank, nicknames.get(userId), levelOf.apply(userId), myScore);

        return new WeeklyRankingResult(week.startDate(), week.endDate(), rankings, myRanking);
    }

    /**
     * 점수 내림차순으로 정렬된 목록에 순위를 매긴다. 같은 점수는 같은 순위 (1, 2, 2, 4).
     * 닉네임을 찾을 수 없는 사용자(탈퇴 등)는 목록에서 뺀다. 순위는 빼기 전 기준이다.
     */
    private static List<WeeklyRankingResult.Entry> toEntries(List<UserScore> top, Long userId,
                                                             Map<Long, String> nicknames,
                                                             Function<Long, Integer> levelOf) {
        List<WeeklyRankingResult.Entry> rankings = new ArrayList<>();
        int rank = 0;
        long previousScore = -1;
        for (int i = 0; i < top.size(); i++) {
            UserScore row = top.get(i);
            if (row.score() != previousScore) {
                rank = i + 1;
                previousScore = row.score();
            }
            String nickname = nicknames.get(row.userId());
            if (nickname == null) {
                continue;
            }
            rankings.add(new WeeklyRankingResult.Entry(rank, nickname, levelOf.apply(row.userId()),
                    row.score(), row.userId().equals(userId)));
        }
        return rankings;
    }

    /**
     * 랭킹 점수 출처. 경험치와 독서 시간이 같은 순위 계산을 쓴다.
     */
    private interface ScoreSource {
        List<UserScore> top(LocalDateTime start, LocalDateTime end, LocalDateTime now);

        long sumOf(Long userId, LocalDateTime start, LocalDateTime end);

        long countGreaterThan(LocalDateTime start, LocalDateTime end, LocalDateTime now, long score);
    }

    private record UserScore(Long userId, long score) {
    }
}
