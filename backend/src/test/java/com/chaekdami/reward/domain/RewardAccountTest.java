package com.chaekdami.reward.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RewardAccountTest {

    private final RewardAccount account = RewardAccount.builder().userId(1L).build();

    @Test
    void 새_계정의_기본값() {
        assertThat(account.getLevel()).isEqualTo(1);
        assertThat(account.getExperience()).isZero();
        assertThat(account.getCurrency()).isZero();
        assertThat(account.getDday()).isZero();
        assertThat(account.getMaxDday()).isZero();
    }

    @Test
    void 경험치로_여러_레벨을_한번에_올리면_승급_보상을_합산해_지급한다() {
        int promotionReward = account.addExperience(500);

        // 누적 80/180/300/440 을 넘어 Lv.5, 보상 100 + 100 + 100 + 500
        assertThat(account.getLevel()).isEqualTo(5);
        assertThat(promotionReward).isEqualTo(800);
        assertThat(account.getCurrency()).isEqualTo(800);
    }

    @Test
    void 레벨업이_없으면_승급_보상은_0() {
        assertThat(account.addExperience(79)).isZero();
        assertThat(account.getLevel()).isEqualTo(1);
    }

    @Test
    void 재화가_부족하면_REWARD_001() {
        account.addCurrency(100);

        assertThatThrownBy(() -> account.deductCurrency(101))
                .isInstanceOf(RewardException.class)
                .extracting("errorCode").isEqualTo(RewardErrorCode.INSUFFICIENT_CURRENCY);
        assertThat(account.getCurrency()).isEqualTo(100);
    }

    @Test
    void 스트릭_연장과_초기화는_최고_기록을_유지한다() {
        account.extendStreak();
        account.extendStreak();
        account.resetStreak();
        account.extendStreak();

        assertThat(account.getDday()).isEqualTo(1);
        assertThat(account.getMaxDday()).isEqualTo(2);
    }

    @Test
    void 금액이_0_이하면_거부한다() {
        assertThatThrownBy(() -> account.addCurrency(0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> account.addExperience(-1)).isInstanceOf(IllegalArgumentException.class);
    }
}
