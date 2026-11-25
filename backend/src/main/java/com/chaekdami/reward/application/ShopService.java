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
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 상점 상품 조회와 구매
 */
@Service
@RequiredArgsConstructor
public class ShopService {

    /** 한 번에 구매할 수 있는 최대 수량. 요청 DTO 의 @Max 와 같은 값으로 맞춘다. */
    public static final int MAX_PURCHASE_QUANTITY = 99;

    private final ShopItemRepository shopItemRepository;
    private final UserItemRepository userItemRepository;
    private final RewardLedger rewardLedger;

    @Transactional(readOnly = true)
    public List<ShopItemView> getActiveItems(Long userId) {
        Map<Long, Integer> owned = userItemRepository.findAllByUserId(userId).stream()
                .collect(Collectors.toMap(item -> item.getShopItemId(), item -> item.getQuantity(), Integer::sum));
        return shopItemRepository.findAllByActiveTrueOrderByIdAsc().stream()
                .map(item -> ShopItemView.of(item, owned.getOrDefault(item.getId(), 0)))
                .toList();
    }

    /**
     * 상품을 purchaseQuantity 개 구매한다. 가격 x 구매 수량만큼 재화를 차감하고, 묶음 수량 x 구매 수량만큼 인벤토리에 더한다.
     * 보상 계정을 잠근 뒤 잔액을 확인하므로 같은 사용자의 연속 구매 요청은 하나씩 처리된다.
     * 가격이 0인 상품은 재화 차감과 차감 이력 없이 인벤토리에만 더한다.
     * 응답이 끊긴 구매를 다시 보내면 앱이 아는 보유 개수와 서버의 개수가 달라지므로, 다르면 구매하지 않는다. (스펙 016)
     *
     * @param ownedQuantity 앱이 알고 있는 그 상품의 보유 개수. null 이면 비교하지 않는다
     */
    @Transactional
    public PurchaseResult purchase(Long userId, Long itemId, int purchaseQuantity, Integer ownedQuantity) {
        if (purchaseQuantity < 1 || purchaseQuantity > MAX_PURCHASE_QUANTITY) {
            throw new IllegalArgumentException(
                    "구매 수량은 1 이상 " + MAX_PURCHASE_QUANTITY + " 이하여야 합니다. (입력: " + purchaseQuantity + ")");
        }
        if (ownedQuantity != null && ownedQuantity < 0) {
            throw new IllegalArgumentException("보유 개수는 0 이상이어야 합니다. (입력: " + ownedQuantity + ")");
        }
        ShopItem item = shopItemRepository.findById(itemId)
                .filter(ShopItem::getActive)
                .orElseThrow(() -> new RewardException(RewardErrorCode.SHOP_ITEM_NOT_FOUND));

        RewardAccount account = rewardLedger.lockAccount(userId);
        // 잠근 뒤에 읽어야 먼저 처리된 구매가 반영된다. 첫 구매로 재화를 다 썼을 수 있어 잔액보다 먼저 비교한다.
        Optional<UserItem> owned = userItemRepository.findByUserIdAndShopItemId(userId, itemId);
        if (ownedQuantity != null && ownedQuantity != owned.map(UserItem::getQuantity).orElse(0).intValue()) {
            throw new RewardException(RewardErrorCode.ITEM_COUNT_CHANGED);
        }
        long totalPrice = (long) item.getPrice() * purchaseQuantity;
        if (totalPrice > account.getCurrency()) {
            throw new RewardException(RewardErrorCode.INSUFFICIENT_CURRENCY);
        }
        Long purchaseId = null;
        if (totalPrice > 0) {
            purchaseId = rewardLedger.deductCurrency(account, (int) totalPrice, TransactionReason.SHOP_PURCHASE);
        }

        UserItem userItem = owned
                .orElseGet(() -> userItemRepository.save(UserItem.builder()
                        .userId(userId)
                        .shopItemId(itemId)
                        .build()));
        userItem.addQuantity(Math.multiplyExact(item.getBundle(), purchaseQuantity));

        return new PurchaseResult(purchaseId, itemId, item.getName(), account.getCurrency(), userItem.getQuantity());
    }
}
