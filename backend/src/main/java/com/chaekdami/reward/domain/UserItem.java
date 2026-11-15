package com.chaekdami.reward.domain;

import com.chaekdami.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자 인벤토리 (사용자 x 상품 1건)
 */
@Getter
@Entity
@Table(
        name = "user_items",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_items_user_id_shop_item_id",
                columnNames = {"user_id", "shop_item_id"}
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserItem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "shop_item_id", nullable = false)
    private Long shopItemId;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Builder
    private UserItem(Long userId, Long shopItemId, Integer quantity) {
        this.userId = userId;
        this.shopItemId = shopItemId;
        this.quantity = quantity != null ? quantity : 0;
    }

    public void addQuantity(int count) {
        validatePositive(count);
        this.quantity += count;
    }

    public void deductQuantity(int count) {
        validatePositive(count);
        if (this.quantity < count) {
            throw new IllegalStateException("보유 아이템 수량이 부족합니다. (보유: " + this.quantity + ", 필요: " + count + ")");
        }
        this.quantity -= count;
    }

    private void validatePositive(int count) {
        if (count <= 0) {
            throw new IllegalArgumentException("count 는 0보다 커야 합니다. (입력: " + count + ")");
        }
    }
}
