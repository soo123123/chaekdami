package com.chaekdami.reward.application;

/**
 * 상점 구매 결과
 *
 * @param purchaseId               구매로 생긴 재화 차감 이력(reward_transactions) id
 * @param updatedInventoryQuantity 구매 후 해당 상품의 보유 수량
 */
public record PurchaseResult(
        Long purchaseId,
        Long itemId,
        String itemName,
        int remainingCurrency,
        int updatedInventoryQuantity
) {
}
