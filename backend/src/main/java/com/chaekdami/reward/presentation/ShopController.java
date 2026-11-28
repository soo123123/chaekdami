package com.chaekdami.reward.presentation;

import com.chaekdami.reward.application.PurchaseResult;
import com.chaekdami.reward.application.ShopItemView;
import com.chaekdami.reward.application.ShopService;
import com.chaekdami.reward.presentation.dto.PurchaseRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/shop/items")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;

    @GetMapping
    public List<ShopItemView> items(@RequestHeader("X-User-Id") Long userId) {
        return shopService.getActiveItems(userId);
    }

    @PostMapping("/{itemId}/purchase")
    public PurchaseResult purchase(@RequestHeader("X-User-Id") Long userId,
                                   @PathVariable Long itemId,
                                   @RequestBody(required = false) PurchaseRequest request) {
        int quantity = request == null || request.purchaseQuantity() == null ? 1 : request.purchaseQuantity();
        Integer ownedQuantity = request == null ? null : request.ownedQuantity();
        return shopService.purchase(userId, itemId, quantity, ownedQuantity);
    }
}
