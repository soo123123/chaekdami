package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
import com.chaekdami.reward.domain.ShopItemType;
import com.chaekdami.reward.domain.UserBuff;
import com.chaekdami.reward.domain.UserItem;
import com.chaekdami.reward.infrastructure.UserBuffRepository;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BoosterServiceTest {

    private static final Long USER_ID = 1L;

    @Mock
    private UserItemRepository userItemRepository;
    @Mock
    private UserBuffRepository userBuffRepository;
    @Mock
    private RewardLedger rewardLedger;
    @InjectMocks
    private BoosterService boosterService;

    @Test
    void 부스터_1개를_써서_30분짜리_버프를_켠다() {
        UserItem booster = boosterStock(3);
        when(userBuffRepository.findActiveBuffs(eq(USER_ID), any())).thenReturn(List.of());
        when(userBuffRepository.save(any(UserBuff.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userItemRepository.sumQuantityByUserIdAndItemType(USER_ID, ShopItemType.EXPERIENCE_BOOSTER)).thenReturn(2);

        BoosterUseResult result = boosterService.use(USER_ID);

        ArgumentCaptor<UserBuff> saved = ArgumentCaptor.forClass(UserBuff.class);
        verify(userBuffRepository).save(saved.capture());
        UserBuff buff = saved.getValue();
        assertThat(booster.getQuantity()).isEqualTo(2);
        assertThat(buff.getBuffActivated()).isTrue();
        assertThat(Duration.between(buff.getBuffStartAt(), buff.getBuffEndAt())).isEqualTo(Duration.ofMinutes(30));
        assertThat(result.buffEndAt()).isEqualTo(buff.getBuffEndAt());
        assertThat(result.remainingBoosters()).isEqualTo(2);
        verify(rewardLedger).lockAccount(USER_ID);
    }

    @Test
    void 적용_중에_또_쓰면_남은_시간에_30분을_더한다() {
        boosterStock(1);
        LocalDateTime start = LocalDateTime.now().minusMinutes(10);
        UserBuff active = UserBuff.builder().userId(USER_ID).buffActivated(true)
                .buffStartAt(start).buffEndAt(start.plusMinutes(30)).build();
        when(userBuffRepository.findActiveBuffs(eq(USER_ID), any())).thenReturn(List.of(active));

        BoosterUseResult result = boosterService.use(USER_ID);

        assertThat(active.getBuffEndAt()).isEqualTo(start.plusMinutes(60));
        assertThat(result.buffEndAt()).isEqualTo(start.plusMinutes(60));
        verify(userBuffRepository, never()).save(any());
    }

    @Test
    void 부스터가_없으면_REWARD_006() {
        when(userItemRepository.findAllInStockByUserIdAndItemType(USER_ID, ShopItemType.EXPERIENCE_BOOSTER))
                .thenReturn(List.of());

        assertThatThrownBy(() -> boosterService.use(USER_ID))
                .isInstanceOf(RewardException.class)
                .extracting("errorCode").isEqualTo(RewardErrorCode.NO_BOOSTER);
        verify(userBuffRepository, never()).save(any());
    }

    private UserItem boosterStock(int quantity) {
        UserItem booster = UserItem.builder().userId(USER_ID).shopItemId(4L).quantity(quantity).build();
        when(userItemRepository.findAllInStockByUserIdAndItemType(USER_ID, ShopItemType.EXPERIENCE_BOOSTER))
                .thenReturn(List.of(booster));
        return booster;
    }
}
