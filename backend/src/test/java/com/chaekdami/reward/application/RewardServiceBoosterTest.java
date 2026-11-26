package com.chaekdami.reward.application;

import com.chaekdami.reward.application.port.ReadingSessionReader;
import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.StreakCalculator;
import com.chaekdami.reward.domain.TransactionReason;
import com.chaekdami.reward.domain.UserBuff;
import com.chaekdami.reward.infrastructure.RewardAccountRepository;
import com.chaekdami.reward.infrastructure.UserBuffRepository;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 독서 경험치와 보상 조회의 부스터 (스펙 009)
 */
@ExtendWith(MockitoExtension.class)
class RewardServiceBoosterTest {

    private static final Long USER_ID = 1L;
    private static final Long SESSION_ID = 42L;
    private static final LocalDateTime ENDED_AT = LocalDateTime.of(2026, 11, 24, 21, 0);

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

    private final RewardAccount account = RewardAccount.builder().userId(USER_ID).build();

    @Test
    void 독서_40분에_부스터_30분이면_30분만큼만_추가_보상하고_남은_시간을_다_쓴다() {
        UserBuff buff = givenBuff(ENDED_AT.minusMinutes(40), 1800);

        ReadingRewardResult result = grant(40, 0);

        assertThat(result.experience()).isEqualTo(70); // 40 + 30
        assertThat(result.boosted()).isTrue();
        assertThat(buff.getRemainingSeconds()).isZero();
        verify(rewardLedger).addExperienceFor(account, 70, TransactionReason.READING_COMPLETE, SESSION_ID);
    }

    @Test
    void 쪽수_경험치도_적용된_시간_비율만큼_추가_보상한다() {
        givenBuff(ENDED_AT.minusMinutes(45), 1800);

        assertThat(grant(45, 45).experience()).isEqualTo(90); // (45 + 9) + 54 * 30 / 45
    }

    @Test
    void 남은_부스터가_없으면_기본_경험치만_지급한다() {
        when(rewardLedger.lockAccount(USER_ID)).thenReturn(account);
        when(userBuffRepository.findRemainingBuffs(USER_ID)).thenReturn(List.of());

        ReadingRewardResult result = grant(40, 0);

        assertThat(result.experience()).isEqualTo(40);
        assertThat(result.boosted()).isFalse();
    }

    @Test
    void 계정을_잠근_뒤에_부스터를_조회한다() {
        givenBuff(ENDED_AT.minusMinutes(40), 1800);

        grant(40, 0);

        InOrder order = inOrder(rewardLedger, userBuffRepository);
        order.verify(rewardLedger).lockAccount(USER_ID);
        order.verify(userBuffRepository).findRemainingBuffs(USER_ID);
    }

    @Test
    void 보상_조회는_남은_부스터_시간을_돌려준다() {
        givenStatus(1200);

        RewardStatusResult result = rewardService.getRewardStatus(USER_ID);

        assertThat(result.expBuffActive()).isTrue();
        assertThat(result.boosterRemainingSeconds()).isEqualTo(1200);
    }

    @Test
    void 남은_부스터_시간이_없으면_0이고_적용_중이_아니다() {
        givenStatus(0);

        RewardStatusResult result = rewardService.getRewardStatus(USER_ID);

        assertThat(result.expBuffActive()).isFalse();
        assertThat(result.boosterRemainingSeconds()).isZero();
    }

    private UserBuff givenBuff(LocalDateTime startAt, int remainingSeconds) {
        UserBuff buff = UserBuff.builder().userId(USER_ID).buffActivated(true)
                .buffStartAt(startAt).remainingSeconds(remainingSeconds).build();
        when(rewardLedger.lockAccount(USER_ID)).thenReturn(account);
        when(userBuffRepository.findRemainingBuffs(USER_ID)).thenReturn(List.of(buff));
        return buff;
    }

    private void givenStatus(int remainingSeconds) {
        when(rewardAccountRepository.findByUserId(USER_ID)).thenReturn(Optional.of(account));
        when(streakService.summarize(eq(USER_ID), any())).thenReturn(new StreakCalculator.Summary(0, 0));
        when(userBuffRepository.sumRemainingSeconds(USER_ID)).thenReturn((long) remainingSeconds);
    }

    private ReadingRewardResult grant(int minutes, int pages) {
        return rewardService.grantReadingExperience(USER_ID,
                new ReadingSessionReader.Session(SESSION_ID, minutes * 60, 10, 10 + pages, ENDED_AT));
    }
}
