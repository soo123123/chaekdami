package com.chaekdami.reward.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LevelPolicyTest {

    @ParameterizedTest
    @CsvSource({"1, 80", "2, 100", "6, 185", "19, 450", "20, 450", "35, 450"})
    void 레벨별_필요_경험치(int level, int expected) {
        assertThat(LevelPolicy.requiredExperience(level)).isEqualTo(expected);
    }

    @ParameterizedTest
    @CsvSource({"1, 0", "2, 80", "5, 440", "10, 1460", "20, 5035", "21, 5485"})
    void 레벨_도달_누적_경험치(int level, int expected) {
        assertThat(LevelPolicy.totalExperienceToReach(level)).isEqualTo(expected);
    }

    @ParameterizedTest
    @CsvSource({
            "2, 100", "9, 100",
            "5, 500", "15, 500", "25, 500",
            "10, 1000", "20, 1000", "30, 1000",
            "11, 150", "19, 150",
            "21, 200", "34, 200"
    })
    void 승급_보상_재화(int reachedLevel, int expected) {
        assertThat(LevelPolicy.promotionReward(reachedLevel)).isEqualTo(expected);
    }

    @Test
    void 잘못된_레벨은_거부한다() {
        assertThatThrownBy(() -> LevelPolicy.requiredExperience(0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> LevelPolicy.promotionReward(1)).isInstanceOf(IllegalArgumentException.class);
    }
}
