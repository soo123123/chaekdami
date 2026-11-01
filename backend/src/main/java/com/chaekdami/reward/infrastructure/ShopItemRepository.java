package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.ShopItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShopItemRepository extends JpaRepository<ShopItem, Long> {

    List<ShopItem> findAllByActiveTrueOrderByIdAsc();
}
