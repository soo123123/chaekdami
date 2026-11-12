package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.ShopItemType;
import com.chaekdami.reward.domain.StreakLog;
import com.chaekdami.reward.domain.UserItem;
import com.chaekdami.reward.infrastructure.StreakLogRepository;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StreakServiceTest {

    private static final Long USER_ID = 1L;
    private static final LocalDate TODAY = LocalDate.now();

    @Mock
    private StreakLogRepository streakLogRepository;
    @Mock
    private UserItemRepository userItemRepository;
    @Mock
    private RewardLedger rewardLedger;
    @InjectMocks
    private StreakService streakService;

    private RewardAccount account;

    @BeforeEach
    void setUp() {
        account = RewardAccount.builder().userId(USER_ID).build();
        when(rewardLedger.lockAccount(USER_ID)).thenReturn(account);
        lenient().when(streakLogRepository.existsByUserIdAndAchievedDate(USER_ID, TODAY)).thenReturn(false);
    }

    @Test
    void 첫_독서는_스트릭_1일() {
        StreakResult result = streakService.recordReadingDay(USER_ID);

        assertThat(result.currentStreak()).isEqualTo(1);
        assertThat(result.newlyAchieved()).isTrue();
        assertThat(result.shieldsUsed()).isZero();
    }

    @Test
    void 어제_읽었으면_방어권_없이_연장() {
        streakOf(3);
        lastLogOn(TODAY.minusDays(1));

        StreakResult result = streakService.recordReadingDay(USER_ID);

        assertThat(result.currentStreak()).isEqualTo(4);
        verify(userItemRepository, never()).findAllInStockByUserIdAndItemType(any(), any());
    }

    @Test
    void 같은_날_두번째_독서는_연장하지_않는다() {
        streakOf(3);
        lastLogOn(TODAY);
        when(streakLogRepository.existsByUserIdAndAchievedDate(USER_ID, TODAY)).thenReturn(true);

        StreakResult result = streakService.recordReadingDay(USER_ID);

        assertThat(result.currentStreak()).isEqualTo(3);
        assertThat(result.newlyAchieved()).isFalse();
        verify(streakLogRepository, never()).save(any());
    }

    @Test
    void 놓친_날마다_방어권_1개씩_차감하고_스트릭을_유지한다() {
        streakOf(5);
        lastLogOn(TODAY.minusDays(3));   // 그제, 어제를 놓침
        UserItem shield = shieldStock(2);

        StreakResult result = streakService.recordReadingDay(USER_ID);

        assertThat(result.shieldsUsed()).isEqualTo(2);
        assertThat(shield.getQuantity()).isZero();
        assertThat(result.currentStreak()).isEqualTo(6);   // 방어한 날은 +0, 오늘 +1
        verify(streakLogRepository, times(3)).save(any(StreakLog.class));
    }

    @Test
    void 방어권이_모자라면_그날_스트릭을_0으로_되돌린다() {
        streakOf(5);
        lastLogOn(TODAY.minusDays(3));
        shieldStock(1);

        StreakResult result = streakService.recordReadingDay(USER_ID);

        assertThat(result.shieldsUsed()).isEqualTo(1);
        assertThat(result.currentStreak()).isEqualTo(1);   // 초기화 후 오늘 +1
        assertThat(result.maxStreak()).isEqualTo(5);
    }

    @Test
    void 스트릭이_0이면_방어권을_쓰지_않는다() {
        lastLogOn(TODAY.minusDays(5));

        StreakResult result = streakService.recordReadingDay(USER_ID);

        assertThat(result.shieldsUsed()).isZero();
        assertThat(result.currentStreak()).isEqualTo(1);
        verify(userItemRepository, never()).findAllInStockByUserIdAndItemType(any(), any());
    }

    private void streakOf(int days) {
        for (int i = 0; i < days; i++) {
            account.extendStreak();
        }
    }

    /** 스트릭이 0이면 정산이 마지막 기록을 조회하지 않고 끝나므로 lenient 로 둔다. */
    private void lastLogOn(LocalDate date) {
        lenient().when(streakLogRepository.findTopByUserIdOrderByAchievedDateDesc(USER_ID))
                .thenReturn(Optional.of(StreakLog.builder().userId(USER_ID).achievedDate(date).build()));
    }

    private UserItem shieldStock(int quantity) {
        UserItem shield = UserItem.builder().userId(USER_ID).shopItemId(10L).quantity(quantity).build();
        when(userItemRepository.findAllInStockByUserIdAndItemType(USER_ID, ShopItemType.SHIELD))
                .thenReturn(List.of(shield));
        return shield;
    }
}
