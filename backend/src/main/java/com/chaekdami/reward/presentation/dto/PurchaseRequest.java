package com.chaekdami.reward.presentation.dto;

import tools.jackson.databind.annotation.JsonDeserialize;

/**
 * @param purchaseQuantity 구매 수량. 없으면 1개
 * @param ownedQuantity    앱이 알고 있는 그 상품의 보유 개수. 없으면 서버의 개수와 비교하지 않는다. JSON 정수만 받는다
 */
public record PurchaseRequest(Integer purchaseQuantity,
                              @JsonDeserialize(using = StrictIntegerDeserializer.class) Integer ownedQuantity) {
}
