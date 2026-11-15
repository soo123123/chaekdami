package com.chaekdami.reward.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ExperiencePolicyTest {

    @ParameterizedTest(name = "{0}초, {1}~{2}쪽 -> {3} EXP")
    @CsvSource({
            "29, 0, 0, 0",     // 30초 미만은 버림
            "30, 0, 0, 1",     // 30초 이상은 1분으로 반올림
            "89, 0, 0, 1",
            "90, 0, 0, 2",
            "0, 0, 2, 0",      // 나머지 2쪽 이하는 버림
            "0, 0, 3, 1",      // 나머지 3쪽 이상은 +1
            "1800, 10, 22, 32",
            "1800, 10, 23, 33"
    })
    void 독서_경험치_반올림(int seconds, int startPage, int endPage, int expected) {
        assertThat(ExperiencePolicy.readingExperience(seconds, startPage, endPage)).isEqualTo(expected);
    }

    @Test
    void 부스터는_경험치를_2배로() {
        assertThat(ExperiencePolicy.boostedExperience(33)).isEqualTo(66);
    }

    @Test
    void 잘못된_입력은_거부한다() {
        assertThatThrownBy(() -> ExperiencePolicy.readingExperience(-1, 0, 0))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> ExperiencePolicy.readingExperience(60, 10, 9))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
