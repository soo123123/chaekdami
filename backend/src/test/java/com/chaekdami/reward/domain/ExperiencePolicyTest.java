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

    @ParameterizedTest(name = "{0} EXP, {2}초 중 {1}초 적용 -> {3} EXP")
    @CsvSource({
            "60, 1200, 3600, 80",   // 1/3 적용
            "60, 3600, 3600, 120",  // 전체 적용
            "60, 5000, 3600, 120",  // 독서 시간보다 길게 겹쳐도 전체 적용까지만
            "60, 0, 3600, 60",      // 적용 안 됨
            "33, 900, 1800, 50",    // 33 + 16.5 -> 반올림 17
            "0, 600, 600, 0",       // 경험치가 0이면 0
            "10, 100, 0, 10"        // 독서 시간 0초면 기본 경험치
    })
    void 부스터는_적용된_시간_비율만큼_2배(int experience, long boostedSeconds, int durationSeconds, int expected) {
        assertThat(ExperiencePolicy.boostedExperience(experience, boostedSeconds, durationSeconds)).isEqualTo(expected);
    }

    @Test
    void 잘못된_입력은_거부한다() {
        assertThatThrownBy(() -> ExperiencePolicy.readingExperience(-1, 0, 0))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> ExperiencePolicy.readingExperience(60, 10, 9))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
