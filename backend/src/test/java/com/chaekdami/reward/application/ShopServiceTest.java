package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
import com.chaekdami.reward.domain.ShopItem;
import com.chaekdami.reward.domain.ShopItemType;
import com.chaekdami.reward.domain.TransactionReason;
import com.chaekdami.reward.domain.UserItem;
import com.chaekdami.reward.infrastructure.ShopItemRepository;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShopServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long ITEM_ID = 3L;

    @Mock
    private ShopItemRepository shopItemRepository;
    @Mock
    private UserItemRepository userItemRepository;
    @Mock
    private RewardLedger rewardLedger;
    @InjectMocks
    private ShopService shopService;

    @Test
    void 가격x수량을_차감하고_묶음x수량을_인벤토리에_더한다() {
        RewardAccount account = accountWith(1_000);
        item(200, 5, true);
        when(rewardLedger.deductCurrency(account, 400, TransactionReason.SHOP_PURCHASE)).thenReturn(45L);
        noInventoryYet();

        PurchaseResult result = shopService.purchase(USER_ID, ITEM_ID, 2);

        assertThat(result.purchaseId()).isEqualTo(45L);
        assertThat(result.updatedInventoryQuantity()).isEqualTo(10);
    }

    @Test
    void 재화가_모자라면_REWARD_001_이고_인벤토리는_그대로() {
        accountWith(399);
        item(200, 1, true);

        assertThatThrownBy(() -> shopService.purchase(USER_ID, ITEM_ID, 2))
                .isInstanceOf(RewardException.class)
                .extracting("errorCode").isEqualTo(RewardErrorCode.INSUFFICIENT_CURRENCY);
        verify(rewardLedger, never()).deductCurrency(any(), anyInt(), any());
        verify(userItemRepository, never()).save(any());
    }

    @Test
    void 총액이_int_범위를_넘어도_REWARD_001() {
        accountWith(1_000);
        item(Integer.MAX_VALUE, 1, true);

        assertThatThrownBy(() -> shopService.purchase(USER_ID, ITEM_ID, 2))
                .isInstanceOf(RewardException.class)
                .extracting("errorCode").isEqualTo(RewardErrorCode.INSUFFICIENT_CURRENCY);
    }

    @Test
    void 무료_상품은_차감_없이_지급하고_purchaseId_는_null() {
        accountWith(0);
        item(0, 1, true);
        noInventoryYet();

        PurchaseResult result = shopService.purchase(USER_ID, ITEM_ID, 1);

        assertThat(result.purchaseId()).isNull();
        assertThat(result.updatedInventoryQuantity()).isEqualTo(1);
        verify(rewardLedger, never()).deductCurrency(any(), anyInt(), any());
    }

    @Test
    void 판매_중지_상품은_SHOP_001() {
        item(200, 1, false);

        assertThatThrownBy(() -> shopService.purchase(USER_ID, ITEM_ID, 1))
                .isInstanceOf(RewardException.class)
                .extracting("errorCode").isEqualTo(RewardErrorCode.SHOP_ITEM_NOT_FOUND);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, ShopService.MAX_PURCHASE_QUANTITY + 1})
    void 구매_수량은_1_이상_최대치_이하(int quantity) {
        assertThatThrownBy(() -> shopService.purchase(USER_ID, ITEM_ID, quantity))
                .isInstanceOf(IllegalArgumentException.class);
        verify(rewardLedger, never()).lockAccount(any());
    }

    private RewardAccount accountWith(int currency) {
        RewardAccount account = RewardAccount.builder().userId(USER_ID).build();
        if (currency > 0) {
            account.addCurrency(currency);
        }
        when(rewardLedger.lockAccount(USER_ID)).thenReturn(account);
        return account;
    }

    private void item(int price, int bundle, boolean active) {
        ShopItem item = ShopItem.builder()
                .name("스트릭 방어권")
                .price(price)
                .type(ShopItemType.SHIELD)
                .bundle(bundle)
                .active(active)
                .build();
        when(shopItemRepository.findById(ITEM_ID)).thenReturn(Optional.of(item));
    }

    private void noInventoryYet() {
        when(userItemRepository.findByUserIdAndShopItemId(USER_ID, ITEM_ID)).thenReturn(Optional.empty());
        when(userItemRepository.save(any(UserItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }
}
