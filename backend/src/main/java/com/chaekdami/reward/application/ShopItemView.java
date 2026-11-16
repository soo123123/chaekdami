package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.ShopItem;
import com.chaekdami.reward.domain.ShopItemType;

public record ShopItemView(
        Long id,
        String name,
        int price,
        ShopItemType type,
        Double effectValue,
        int bundle,
        int ownedQuantity
) {

    public static ShopItemView of(ShopItem item, int ownedQuantity) {
        return new ShopItemView(
                item.getId(),
                item.getName(),
                item.getPrice(),
                item.getType(),
                item.getEffectValue(),
                item.getBundle(),
                ownedQuantity
        );
    }
}
