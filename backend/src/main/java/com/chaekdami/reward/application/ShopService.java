package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
import com.chaekdami.reward.domain.ShopItem;
import com.chaekdami.reward.domain.TransactionReason;
import com.chaekdami.reward.domain.UserItem;
import com.chaekdami.reward.infrastructure.ShopItemRepository;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 상점 상품 조회와 구매
 */
@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopItemRepository shopItemRepository;
    private final UserItemRepository userItemRepository;
    private final RewardLedger rewardLedger;

    @Transactional(readOnly = true)
    public List<ShopItem> getActiveItems() {
        return shopItemRepository.findAllByActiveTrueOrderByIdAsc();
    }

    /**
     * 상품을 purchaseQuantity 개 구매한다. 가격 x 구매 수량만큼 재화를 차감하고, 묶음 수량 x 구매 수량만큼 인벤토리에 더한다.
     * 보상 계정을 잠근 뒤 잔액을 확인하므로 같은 사용자의 연속 구매 요청은 하나씩 처리된다.
     * 가격이 0인 상품은 재화 차감과 차감 이력 없이 인벤토리에만 더한다.
     */
    @Transactional
    public PurchaseResult purchase(Long userId, Long itemId, int purchaseQuantity) {
        if (purchaseQuantity <= 0) {
            throw new IllegalArgumentException("구매 수량은 1 이상이어야 합니다. (입력: " + purchaseQuantity + ")");
        }
        ShopItem item = shopItemRepository.findById(itemId)
                .filter(ShopItem::getActive)
                .orElseThrow(() -> new RewardException(RewardErrorCode.SHOP_ITEM_NOT_FOUND));

        RewardAccount account = rewardLedger.lockAccount(userId);
        int totalPrice = Math.multiplyExact(item.getPrice(), purchaseQuantity);
        Long purchaseId = null;
        if (totalPrice > 0) {
            purchaseId = rewardLedger.deductCurrency(account, totalPrice, TransactionReason.SHOP_PURCHASE);
        }

        UserItem userItem = userItemRepository.findByUserIdAndShopItemId(userId, itemId)
                .orElseGet(() -> userItemRepository.save(UserItem.builder()
                        .userId(userId)
                        .shopItemId(itemId)
                        .build()));
        userItem.addQuantity(Math.multiplyExact(item.getBundle(), purchaseQuantity));

        return new PurchaseResult(purchaseId, itemId, item.getName(), account.getCurrency(), userItem.getQuantity());
    }
}
