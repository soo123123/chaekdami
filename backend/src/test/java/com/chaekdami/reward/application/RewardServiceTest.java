package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.ShopItemType;
import com.chaekdami.reward.domain.StreakCalculator;
import com.chaekdami.reward.infrastructure.RewardAccountRepository;
import com.chaekdami.reward.infrastructure.UserBuffRepository;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RewardServiceTest {

    private static final Long USER_ID = 1L;

    @Mock
    private RewardAccountRepository rewardAccountRepository;
    @Mock
    private UserItemRepository userItemRepository;
    @Mock
    private UserBuffRepository userBuffRepository;
    @Mock
    private RewardLedger rewardLedger;
    @Mock
    private StreakService streakService;
    @InjectMocks
    private RewardService rewardService;

    private RewardAccount account;

    @BeforeEach
    void setUp() {
        account = RewardAccount.builder().userId(USER_ID).build();
        account.addCurrency(1000);
        account.syncStreak(5, 7);
        when(rewardAccountRepository.findByUserId(USER_ID)).thenReturn(Optional.of(account));
        when(streakService.summarize(eq(USER_ID), any())).thenReturn(new StreakCalculator.Summary(8, 9));
        when(userItemRepository.sumQuantityByUserIdAndItemType(USER_ID, ShopItemType.SHIELD)).thenReturn(2);
        when(userBuffRepository.sumRemainingSeconds(USER_ID)).thenReturn(0L);
    }

    @Test
    void 보상_조회는_잠그지_않고_읽은_계정을_바꾸지_않는다() {
        rewardService.getRewardStatus(USER_ID);

        // 하나라도 바뀌면 계정 행 전체가 저장되어, 동시에 처리된 구매/보상 결과를 옛값으로 덮어쓴다.
        assertThat(account).usingRecursiveComparison().isEqualTo(unchangedAccount());
    }

    @Test
    void 연속_일수는_계정의_사본이_아니라_달력으로_계산한_값을_돌려준다() {
        RewardStatusResult result = rewardService.getRewardStatus(USER_ID);

        assertThat(result.currentStreak()).isEqualTo(8);
        assertThat(result.currency()).isEqualTo(1000);
        assertThat(result.level()).isEqualTo(1);
        assertThat(result.ownedShieldCount()).isEqualTo(2);
    }

    @Test
    void 놓친_날을_방어권으로_정산한_뒤에_연속_일수를_계산한다() {
        rewardService.getRewardStatus(USER_ID);

        InOrder order = inOrder(streakService);
        order.verify(streakService).settleBefore(eq(USER_ID), any());
        order.verify(streakService).summarize(eq(USER_ID), any());
    }

    private static RewardAccount unchangedAccount() {
        RewardAccount expected = RewardAccount.builder().userId(USER_ID).build();
        expected.addCurrency(1000);
        expected.syncStreak(5, 7);
        return expected;
    }
}
