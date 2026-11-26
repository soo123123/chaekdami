package com.chaekdami.reward.application;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.IntFunction;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 연결 풀이 실제와 같은 3개일 때 처음 들어온 요청이 겹쳐도 보상 계정이 만들어지는지 확인한다. (ISSUE-BUG-29)
 * H2(메모리)를 쓰므로 팀 DB에 연결하지 않고, PostgreSQL 전용 동작은 확인하지 않는다.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:rewardaccounts;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "spring.datasource.hikari.maximum-pool-size=3",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
class RewardAccountConcurrentCreationTest {

    private static final int REQUESTS = 3;

    @Autowired
    private RewardService rewardService;
    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void 같은_사용자의_첫_요청이_겹쳐도_계정은_하나만_생긴다() throws Exception {
        requestAtOnce(i -> 201L);

        assertThat(accountCount(201L)).isEqualTo(1);
    }

    @Test
    void 새_사용자_여러_명의_첫_요청이_겹쳐도_모두_성공한다() throws Exception {
        requestAtOnce(i -> 301L + i);

        for (int i = 0; i < REQUESTS; i++) {
            assertThat(accountCount(301L + i)).isEqualTo(1);
        }
    }

    private void requestAtOnce(IntFunction<Long> userIdOf) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(REQUESTS);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<RewardStatusResult>> results = new ArrayList<>();
            for (int i = 0; i < REQUESTS; i++) {
                Long userId = userIdOf.apply(i);
                results.add(pool.submit(() -> {
                    start.await();
                    return rewardService.getRewardStatus(userId);
                }));
            }
            start.countDown();
            for (Future<RewardStatusResult> result : results) {
                assertThat(result.get(20, TimeUnit.SECONDS).level()).isEqualTo(1);
            }
        } finally {
            pool.shutdownNow();
        }
    }

    private Integer accountCount(long userId) {
        return jdbc.queryForObject("select count(*) from reward_accounts where user_id = ?", Integer.class, userId);
    }
}
