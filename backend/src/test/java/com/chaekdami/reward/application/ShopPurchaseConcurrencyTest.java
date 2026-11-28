package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
import com.chaekdami.reward.domain.ShopItem;
import com.chaekdami.reward.domain.ShopItemType;
import com.chaekdami.reward.infrastructure.ShopItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 응답이 끊겨 다시 보낸 구매와 동시에 온 구매가 한 번만 처리되는지 확인한다. (스펙 016, ISSUE-BUG-35)
 * H2(메모리)를 쓰므로 팀 DB에 연결하지 않고, PostgreSQL 전용 동작은 확인하지 않는다.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:shoppurchase;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
class ShopPurchaseConcurrencyTest {

    private static final Long USER_ID = 501L;
    private static final int PRICE = 200;
    private static final int REQUESTS = 2;

    @Autowired
    private ShopService shopService;
    @Autowired
    private RewardService rewardService;
    @Autowired
    private ShopItemRepository shopItemRepository;
    @Autowired
    private JdbcTemplate jdbc;

    private Long itemId;

    @BeforeEach
    void setUp() {
        jdbc.update("delete from user_items");
        jdbc.update("delete from reward_transactions");
        jdbc.update("delete from reward_accounts");
        rewardService.createAccount(USER_ID);
        currency(1_000);
        itemId = shopItemRepository.save(ShopItem.builder()
                .name("테스트 부스터").price(PRICE).type(ShopItemType.EXPERIENCE_BOOSTER)
                .effectValue(30.0).bundle(1).active(true).build()).getId();
    }

    @Test
    void 응답이_끊긴_구매를_같은_개수로_다시_보내면_한_번만_차감된다() {
        shopService.purchase(USER_ID, itemId, 1, 0);   // 서버는 처리했지만 앱은 응답을 받지 못했다

        assertItemCountChanged(0);

        assertPurchasedOnce(1_000);
    }

    @Test
    void 첫_구매로_재화를_다_썼어도_재화_부족이_아니라_개수가_달라졌다고_답한다() {
        currency(PRICE);
        shopService.purchase(USER_ID, itemId, 1, 0);

        assertItemCountChanged(0);

        assertPurchasedOnce(PRICE);
    }

    @Test
    void 개수를_다시_조회해_보내면_구매할_수_있다() {
        shopService.purchase(USER_ID, itemId, 1, 0);

        shopService.purchase(USER_ID, itemId, 1, 1);

        assertThat(quantity()).isEqualTo(2);
        assertThat(currency()).isEqualTo(1_000 - 2 * PRICE);
    }

    @Test
    void 처음_사는_상품의_같은_요청이_겹치면_하나만_처리한다() throws Exception {
        assertThat(purchaseAtOnce(0)).containsExactly(RewardErrorCode.ITEM_COUNT_CHANGED);

        assertPurchasedOnce(1_000);
    }

    @Test
    void 가진_상품의_같은_요청이_겹치면_하나만_처리한다() throws Exception {
        shopService.purchase(USER_ID, itemId, 1, 0);
        currency(1_000);

        assertThat(purchaseAtOnce(1)).containsExactly(RewardErrorCode.ITEM_COUNT_CHANGED);

        assertThat(quantity()).isEqualTo(2);
        assertThat(currency()).isEqualTo(1_000 - PRICE);
    }

    @Test
    void 개수를_보내지_않으면_지금처럼_모두_처리한다() {
        shopService.purchase(USER_ID, itemId, 1, null);
        shopService.purchase(USER_ID, itemId, 1, null);

        assertThat(quantity()).isEqualTo(2);
        assertThat(currency()).isEqualTo(1_000 - 2 * PRICE);
    }

    /** 같은 구매를 동시에 보내고, 실패한 요청의 오류 코드를 돌려준다. */
    private List<RewardErrorCode> purchaseAtOnce(int ownedQuantity) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(REQUESTS);
        CountDownLatch start = new CountDownLatch(1);
        List<RewardErrorCode> errors = new ArrayList<>();
        try {
            List<Future<PurchaseResult>> results = new ArrayList<>();
            for (int i = 0; i < REQUESTS; i++) {
                results.add(pool.submit(() -> {
                    start.await();
                    return shopService.purchase(USER_ID, itemId, 1, ownedQuantity);
                }));
            }
            start.countDown();
            for (Future<PurchaseResult> result : results) {
                try {
                    result.get(20, TimeUnit.SECONDS);
                } catch (ExecutionException failed) {
                    assertThat(failed.getCause()).isInstanceOf(RewardException.class);
                    errors.add(((RewardException) failed.getCause()).getErrorCode());
                }
            }
        } finally {
            pool.shutdownNow();
        }
        return errors;
    }

    private void assertItemCountChanged(int ownedQuantity) {
        assertThatThrownBy(() -> shopService.purchase(USER_ID, itemId, 1, ownedQuantity))
                .isInstanceOf(RewardException.class)
                .extracting("errorCode").isEqualTo(RewardErrorCode.ITEM_COUNT_CHANGED);
    }

    private void assertPurchasedOnce(int currencyBefore) {
        assertThat(quantity()).isEqualTo(1);
        assertThat(currency()).isEqualTo(currencyBefore - PRICE);
        assertThat(jdbc.queryForObject("select count(*) from reward_transactions where user_id = ?",
                Integer.class, USER_ID)).isEqualTo(1);
    }

    private void currency(int amount) {
        jdbc.update("update reward_accounts set currency = ? where user_id = ?", amount, USER_ID);
    }

    private Integer currency() {
        return jdbc.queryForObject("select currency from reward_accounts where user_id = ?", Integer.class, USER_ID);
    }

    private Integer quantity() {
        return jdbc.queryForObject("select quantity from user_items where user_id = ? and shop_item_id = ?",
                Integer.class, USER_ID, itemId);
    }
}
