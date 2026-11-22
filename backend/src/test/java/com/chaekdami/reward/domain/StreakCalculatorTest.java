package com.chaekdami.reward.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class StreakCalculatorTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 19);
    private static final boolean READ = true;
    private static final boolean PROTECTED = false;

    @Test
    void 읽은_날만_세고_방어한_날은_끊기지만_않게_한다() {
        Map<LocalDate, Boolean> days = days(
                TODAY.minusDays(3), READ,
                TODAY.minusDays(2), PROTECTED,
                TODAY.minusDays(1), READ,
                TODAY, READ);

        StreakCalculator.Summary summary = StreakCalculator.summarize(days, TODAY);

        assertThat(summary.currentStreak()).isEqualTo(3);
        assertThat(summary.longestStreak()).isEqualTo(3);
    }

    @Test
    void 오늘_아직_안_읽었으면_어제까지의_연속을_보여준다() {
        Map<LocalDate, Boolean> days = days(
                TODAY.minusDays(2), READ,
                TODAY.minusDays(1), READ);

        assertThat(StreakCalculator.summarize(days, TODAY).currentStreak()).isEqualTo(2);
    }

    @Test
    void 빈_날이_있으면_연속이_끊기고_최고_기록은_남는다() {
        Map<LocalDate, Boolean> days = days(
                TODAY.minusDays(6), READ,
                TODAY.minusDays(5), READ,
                TODAY.minusDays(4), READ,
                TODAY.minusDays(2), READ);

        StreakCalculator.Summary summary = StreakCalculator.summarize(days, TODAY);

        assertThat(summary.currentStreak()).isZero();
        assertThat(summary.longestStreak()).isEqualTo(3);
    }

    @Test
    void 기록이_없으면_0() {
        assertThat(StreakCalculator.summarize(Map.of(), TODAY)).isEqualTo(new StreakCalculator.Summary(0, 0));
    }

    private static Map<LocalDate, Boolean> days(Object... dateAndRead) {
        Map<LocalDate, Boolean> days = new LinkedHashMap<>();
        for (int i = 0; i < dateAndRead.length; i += 2) {
            days.put((LocalDate) dateAndRead[i], (Boolean) dateAndRead[i + 1]);
        }
        return days;
    }
}
