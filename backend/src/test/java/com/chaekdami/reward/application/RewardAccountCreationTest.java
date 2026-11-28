package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.infrastructure.RewardAccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 연결이 1개뿐인 풀에서도 보상 계정을 처음 만들 수 있는지 확인한다. (ISSUE-BUG-29)
 * H2(메모리)를 쓰므로 팀 DB에 연결하지 않고, PostgreSQL 전용 동작은 확인하지 않는다.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:rewardaccount;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "spring.datasource.hikari.maximum-pool-size=1",
        "spring.datasource.hikari.connection-timeout=1000",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
class RewardAccountCreationTest {

    @Autowired
    private RewardService rewardService;
    @Autowired
    private RewardLedger rewardLedger;
    @Autowired
    private RewardAccountRepository rewardAccountRepository;
    @Autowired
    private TransactionTemplate transaction;
    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void 처음_보상을_조회하는_사용자의_계정을_연결_1개로_만든다() {
        RewardStatusResult result = rewardService.getRewardStatus(101L);

        assertThat(result.level()).isEqualTo(1);
        assertThat(result.currency()).isZero();
        assertThat(accountCount(101L)).isEqualTo(1);
    }

    @Test
    void 계정이_없는_사용자를_잠글_때도_연결_1개로_만들고_잠근다() {
        Long userId = transaction.execute(status -> rewardLedger.lockAccount(102L).getUserId());

        assertThat(userId).isEqualTo(102L);
        assertThat(accountCount(102L)).isEqualTo(1);
    }

    @Test
    void 새_계정의_값과_시각이_저장된다() {
        rewardService.createAccount(103L);

        RewardAccount account = rewardAccountRepository.findByUserId(103L).orElseThrow();
        assertThat(account.getCurrency()).isZero();
        assertThat(account.getExperience()).isZero();
        assertThat(account.getLevel()).isEqualTo(1);
        assertThat(account.getDday()).isZero();
        assertThat(account.getMaxDday()).isZero();
        assertThat(account.getCreatedAt()).isNotNull();
        assertThat(account.getUpdatedAt()).isNotNull();
    }

    @Test
    void 이미_있는_계정은_바꾸지_않고_트랜잭션도_계속_쓸_수_있다() {
        rewardService.createAccount(104L);
        jdbc.update("update reward_accounts set currency = 500 where user_id = 104");

        Integer currency = transaction.execute(status -> {
            int inserted = rewardAccountRepository.insertIfAbsent(
                    RewardAccount.builder().userId(104L).build(), LocalDateTime.now());
            assertThat(inserted).isZero();
            return rewardAccountRepository.findByUserId(104L).orElseThrow().getCurrency();
        });

        assertThat(currency).isEqualTo(500);
        assertThat(accountCount(104L)).isEqualTo(1);
    }

    private Integer accountCount(long userId) {
        return jdbc.queryForObject("select count(*) from reward_accounts where user_id = ?", Integer.class, userId);
    }
}
