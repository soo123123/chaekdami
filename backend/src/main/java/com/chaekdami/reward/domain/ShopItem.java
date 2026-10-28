package com.chaekdami.reward.domain;

import com.chaekdami.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 상점 상품 마스터
 */
@Getter
@Entity
@Table(name = "shop_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ShopItem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "price", nullable = false)
    private Integer price;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private ShopItemType type;

    @Column(name = "effect_value")
    private Double effectValue;

    @Column(name = "bundle", nullable = false)
    private Integer bundle;

    @Column(name = "is_active", nullable = false)
    private Boolean active;

    @Builder
    private ShopItem(String name, Integer price, ShopItemType type, Double effectValue, Integer bundle, Boolean active) {
        this.name = name;
        this.price = price;
        this.type = type;
        this.effectValue = effectValue;
        this.bundle = bundle != null ? bundle : 1;
        this.active = active != null ? active : true;
    }
}
