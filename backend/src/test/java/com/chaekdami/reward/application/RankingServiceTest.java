package com.chaekdami.reward.application;

import com.chaekdami.reward.application.port.UserNicknameReader;
import com.chaekdami.reward.application.port.WeeklyReadingTimeReader;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.TransactionType;
import com.chaekdami.reward.infrastructure.RewardAccountRepository;
import com.chaekdami.reward.infrastructure.RewardTransactionRepository;
import com.chaekdami.reward.infrastructure.RewardTransactionRepository.UserAmount;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RankingServiceTest {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final ZoneId UTC = ZoneId.of("UTC");
    private static final ZonedDateTime NOW = ZonedDateTime.of(2026, 11, 25, 12, 0, 0, 0, SEOUL);
    private static final LocalDateTime START = LocalDateTime.of(2026, 11, 23, 0, 0);
    private static final LocalDateTime END = LocalDateTime.of(2026, 11, 30, 0, 0);
    private static final TransactionType EXP = TransactionType.INCOME_EXPERIENCE;
    private static final Long ME = 2L;

    @Mock
    private RewardTransactionRepository rewardTransactionRepository;
    @Mock
    private RewardAccountRepository rewardAccountRepository;
    @Mock
    private UserNicknameReader userNicknameReader;
    @Mock
    private WeeklyReadingTimeReader weeklyReadingTimeReader;
    @InjectMocks
    private RankingService rankingService;

    @Test
    void 독서_시간_랭킹은_이번_주_세션_독서_시간_합으로_순위를_매긴다() {
        given(weeklyReadingTimeReader.findTop(START, END, 30)).willReturn(List.of(
                new WeeklyReadingTimeReader.UserSeconds(3L, 7200),
                new WeeklyReadingTimeReader.UserSeconds(ME, 3600),
                new WeeklyReadingTimeReader.UserSeconds(1L, 3600)));
        given(weeklyReadingTimeReader.sumOf(ME, START, END)).willReturn(3600L);
        given(weeklyReadingTimeReader.countUsersGreaterThan(START, END, 3600L)).willReturn(1L);
        givenNicknames(Map.of(1L, "책벌레", ME, "다독왕", 3L, "밤독서"));

        WeeklyRankingResult result = rankingService.getWeeklyReadingTimeRanking(ME, NOW, SEOUL);

        assertThat(result.rankings()).containsExactly(
                new WeeklyRankingResult.Entry(1, "밤독서", 1, 7200, false),
                new WeeklyRankingResult.Entry(2, "다독왕", 1, 3600, true),
                new WeeklyRankingResult.Entry(2, "책벌레", 1, 3600, false));
        assertThat(result.myRanking()).isEqualTo(new WeeklyRankingResult.MyRanking(2, "다독왕", 1, 3600));
        verify(rewardTransactionRepository, never()).findTopAmounts(any(), any(), any(), any());
    }

    @Test
    void 이번_주_독서_시간이_없으면_내_순위는_없다() {
        given(weeklyReadingTimeReader.findTop(START, END, 30)).willReturn(List.of());
        given(weeklyReadingTimeReader.sumOf(ME, START, END)).willReturn(0L);
        givenNicknames(Map.of(ME, "다독왕"));

        WeeklyRankingResult result = rankingService.getWeeklyReadingTimeRanking(ME, NOW, SEOUL);

        assertThat(result.rankings()).isEmpty();
        assertThat(result.myRanking()).isEqualTo(new WeeklyRankingResult.MyRanking(null, "다독왕", 1, 0));
        verify(weeklyReadingTimeReader, never()).countUsersGreaterThan(any(), any(), anyLong());
    }

    @Test
    void 경험치가_같으면_같은_순위를_주고_다음_순위는_건너뛴다() {
        givenTop(row(1L, 540), row(ME, 320), row(3L, 320), row(4L, 15));
        givenMine(320, 1);
        givenNicknames(Map.of(1L, "책벌레", ME, "다독왕", 3L, "밤독서", 4L, "새내기"));
        given(rewardAccountRepository.findAllByUserIdIn(anyCollection()))
                .willReturn(List.of(account(1L, 7), account(ME, 5), account(3L, 9)));

        WeeklyRankingResult result = rankingService.getWeeklyExperienceRanking(ME, NOW, SEOUL);

        assertThat(result.weekStartDate()).isEqualTo(LocalDate.of(2026, 11, 23));
        assertThat(result.weekEndDate()).isEqualTo(LocalDate.of(2026, 11, 29));
        assertThat(result.rankings()).containsExactly(
                new WeeklyRankingResult.Entry(1, "책벌레", 7, 540, false),
                new WeeklyRankingResult.Entry(2, "다독왕", 5, 320, true),
                new WeeklyRankingResult.Entry(2, "밤독서", 9, 320, false),
                new WeeklyRankingResult.Entry(4, "새내기", 1, 15, false));
        assertThat(result.myRanking()).isEqualTo(new WeeklyRankingResult.MyRanking(2, "다독왕", 5, 320));
    }

    @Test
    void 상위_30명을_요청한다() {
        givenTop();
        givenMine(0, 0);
        givenNicknames(Map.of(ME, "다독왕"));

        rankingService.getWeeklyExperienceRanking(ME, NOW, SEOUL);

        verify(rewardTransactionRepository).findTopAmounts(eq(EXP), eq(START), eq(END),
                argThat((Pageable p) -> p.getPageNumber() == 0 && p.getPageSize() == 30));
    }

    @Test
    void 상위_30명_밖이어도_내_순위를_준다() {
        givenTop(row(1L, 900));
        givenMine(40, 44);
        givenNicknames(Map.of(1L, "책벌레", ME, "다독왕"));
        given(rewardAccountRepository.findAllByUserIdIn(anyCollection())).willReturn(List.of(account(ME, 3)));

        WeeklyRankingResult result = rankingService.getWeeklyExperienceRanking(ME, NOW, SEOUL);

        assertThat(result.rankings()).extracting(WeeklyRankingResult.Entry::me).containsExactly(false);
        assertThat(result.myRanking()).isEqualTo(new WeeklyRankingResult.MyRanking(45, "다독왕", 3, 40));
    }

    @Test
    void 이번_주_경험치가_0이면_내_순위는_없고_계정이_없으면_레벨_1이다() {
        givenTop(row(1L, 100));
        givenMine(0, 0);
        givenNicknames(Map.of(1L, "책벌레", ME, "다독왕"));

        WeeklyRankingResult result = rankingService.getWeeklyExperienceRanking(ME, NOW, SEOUL);

        assertThat(result.myRanking()).isEqualTo(new WeeklyRankingResult.MyRanking(null, "다독왕", 1, 0));
        verify(rewardTransactionRepository, never())
                .countUsersWithAmountGreaterThan(any(), any(), any(), anyLong());
    }

    @Test
    void 닉네임을_찾을_수_없는_사용자는_목록에서_뺀다() {
        givenTop(row(9L, 300), row(1L, 200));
        givenMine(0, 0);
        givenNicknames(Map.of(1L, "책벌레", ME, "다독왕"));

        WeeklyRankingResult result = rankingService.getWeeklyExperienceRanking(ME, NOW, SEOUL);

        assertThat(result.rankings()).containsExactly(new WeeklyRankingResult.Entry(2, "책벌레", 1, 200, false));
    }

    @Test
    void 서버_시간대가_UTC면_한국_주_경계를_UTC_시각으로_조회한다() {
        givenEmptyTopInUtc();
        given(rewardTransactionRepository.sumAmount(ME, EXP,
                LocalDateTime.of(2026, 11, 22, 15, 0), LocalDateTime.of(2026, 11, 29, 15, 0))).willReturn(0L);
        givenNicknames(Map.of(ME, "다독왕"));

        WeeklyRankingResult result = rankingService.getWeeklyExperienceRanking(ME, NOW, UTC);

        assertThat(result.weekStartDate()).isEqualTo(LocalDate.of(2026, 11, 23));
    }

    private void givenTop(UserAmount... rows) {
        given(rewardTransactionRepository.findTopAmounts(eq(EXP), eq(START), eq(END), any(Pageable.class)))
                .willReturn(List.of(rows));
    }

    private void givenEmptyTopInUtc() {
        given(rewardTransactionRepository.findTopAmounts(eq(EXP), eq(LocalDateTime.of(2026, 11, 22, 15, 0)),
                eq(LocalDateTime.of(2026, 11, 29, 15, 0)), any(Pageable.class))).willReturn(List.of());
    }

    private void givenMine(long amount, long greaterCount) {
        given(rewardTransactionRepository.sumAmount(ME, EXP, START, END)).willReturn(amount);
        if (amount > 0) {
            given(rewardTransactionRepository.countUsersWithAmountGreaterThan(EXP, START, END, amount))
                    .willReturn(greaterCount);
        }
    }

    private void givenNicknames(Map<Long, String> nicknames) {
        given(userNicknameReader.findNicknames(anyCollection())).willReturn(nicknames);
    }

    private static UserAmount row(Long userId, long amount) {
        return new Row(userId, amount);
    }

    private static RewardAccount account(Long userId, int level) {
        RewardAccount account = RewardAccount.builder().userId(userId).build();
        ReflectionTestUtils.setField(account, "level", level);
        return account;
    }

    private record Row(Long userId, Long amount) implements UserAmount {
        @Override
        public Long getUserId() {
            return userId;
        }

        @Override
        public Long getAmount() {
            return amount;
        }
    }
}
