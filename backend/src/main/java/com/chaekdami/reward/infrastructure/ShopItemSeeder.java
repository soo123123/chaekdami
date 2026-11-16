package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.ShopItem;
import com.chaekdami.reward.domain.ShopItemType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 상점 상품이 없으면 알파 테스트용 상품을 넣는다.
 * 같은 이름의 행이 있으면 가격과 수량을 바꾸지 않는다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ShopItemSeeder implements ApplicationRunner {

    private final ShopItemRepository shopItemRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int inserted = 0;
        inserted += insertIfAbsent("D-day 방어권 1개", 200, ShopItemType.SHIELD, 1.0, 1);
        inserted += insertIfAbsent("D-day 방어권 5개", 900, ShopItemType.SHIELD, 1.0, 5);
        inserted += insertIfAbsent("D-day 방어권 10개", 1600, ShopItemType.SHIELD, 1.0, 10);
        inserted += insertIfAbsent("EXP 부스터 1개", 200, ShopItemType.EXPERIENCE_BOOSTER, 30.0, 1);
        inserted += insertIfAbsent("EXP 부스터 5개", 900, ShopItemType.EXPERIENCE_BOOSTER, 30.0, 5);
        inserted += insertIfAbsent("EXP 부스터 10개", 1600, ShopItemType.EXPERIENCE_BOOSTER, 30.0, 10);
        if (inserted > 0) {
            log.info("상점 상품 {}건 추가", inserted);
        }
    }

    private int insertIfAbsent(String name, int price, ShopItemType type, double effectValue, int bundle) {
        if (shopItemRepository.findFirstByName(name).isPresent()) {
            return 0;
        }
        shopItemRepository.save(ShopItem.builder()
                .name(name)
                .price(price)
                .type(type)
                .effectValue(effectValue)
                .bundle(bundle)
                .active(true)
                .build());
        return 1;
    }
}
