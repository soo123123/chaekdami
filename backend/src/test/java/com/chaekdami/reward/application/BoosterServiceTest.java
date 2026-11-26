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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
    void 부스터_1개를_써서_책_읽는_30분짜리_버프를_켠다() {
        UserItem booster = boosterStock(3);
        when(userItemRepository.sumQuantityByUserIdAndItemType(USER_ID, ShopItemType.EXPERIENCE_BOOSTER)).thenReturn(2);
        when(userBuffRepository.sumRemainingSeconds(USER_ID)).thenReturn(1800L);

        BoosterUseResult result = boosterService.use(USER_ID);

        UserBuff buff = savedBuff();
        assertThat(booster.getQuantity()).isEqualTo(2);
        assertThat(buff.getBuffActivated()).isTrue();
        assertThat(buff.getBuffStartAt()).isNotNull();
        assertThat(buff.getRemainingSeconds()).isEqualTo(30 * 60);
        assertThat(result.boosterRemainingSeconds()).isEqualTo(1800);
        assertThat(result.remainingBoosters()).isEqualTo(2);
        verify(rewardLedger).lockAccount(USER_ID);
    }

    @Test
    void 남아_있을_때_또_쓰면_30분짜리를_새로_더하고_합계를_돌려준다() {
        boosterStock(1);
        when(userBuffRepository.sumRemainingSeconds(USER_ID)).thenReturn(3000L);

        BoosterUseResult result = boosterService.use(USER_ID);

        assertThat(savedBuff().getRemainingSeconds()).isEqualTo(30 * 60);
        assertThat(result.boosterRemainingSeconds()).isEqualTo(3000);
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

    private UserBuff savedBuff() {
        ArgumentCaptor<UserBuff> saved = ArgumentCaptor.forClass(UserBuff.class);
        verify(userBuffRepository).save(saved.capture());
        return saved.getValue();
    }

    private UserItem boosterStock(int quantity) {
        UserItem booster = UserItem.builder().userId(USER_ID).shopItemId(4L).quantity(quantity).build();
        when(userItemRepository.findAllInStockByUserIdAndItemType(USER_ID, ShopItemType.EXPERIENCE_BOOSTER))
                .thenReturn(List.of(booster));
        return booster;
    }
}
