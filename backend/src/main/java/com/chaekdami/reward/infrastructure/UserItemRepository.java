package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.ShopItemType;
import com.chaekdami.reward.domain.UserItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserItemRepository extends JpaRepository<UserItem, Long> {

    Optional<UserItem> findByUserIdAndShopItemId(Long userId, Long shopItemId);

    List<UserItem> findAllByUserId(Long userId);

    /**
     * 사용자가 보유한 특정 종류 아이템의 수량 합계 (예: 스트릭 방어권 보유 개수)
     */
    @Query("select coalesce(sum(ui.quantity), 0) from UserItem ui, ShopItem si"
            + " where si.id = ui.shopItemId and ui.userId = :userId and si.type = :type")
    int sumQuantityByUserIdAndItemType(@Param("userId") Long userId, @Param("type") ShopItemType type);

    /**
     * 사용자가 보유 중(수량 1 이상)인 특정 종류 아이템을 먼저 들어온 순으로 조회한다. (예: 차감할 스트릭 방어권)
     */
    @Query("select ui from UserItem ui, ShopItem si"
            + " where si.id = ui.shopItemId and ui.userId = :userId and si.type = :type and ui.quantity > 0"
            + " order by ui.id")
    List<UserItem> findAllInStockByUserIdAndItemType(@Param("userId") Long userId, @Param("type") ShopItemType type);
}
