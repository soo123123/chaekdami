package com.chaekdami.reward.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class RankingWeekTest {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final ZoneId UTC = ZoneId.of("UTC");

    @Test
    void 월요일_0시는_그_주의_시작이다() {
        RankingWeek week = RankingWeek.containing(ZonedDateTime.of(2026, 11, 23, 0, 0, 0, 0, SEOUL));

        assertThat(week.startDate()).isEqualTo(LocalDate.of(2026, 11, 23));
        assertThat(week.endDate()).isEqualTo(LocalDate.of(2026, 11, 29));
    }

    @Test
    void 일요일_23시59분은_지난_월요일에_시작한_주에_속한다() {
        RankingWeek week = RankingWeek.containing(ZonedDateTime.of(2026, 11, 22, 23, 59, 0, 0, SEOUL));

        assertThat(week.startDate()).isEqualTo(LocalDate.of(2026, 11, 16));
        assertThat(week.endDate()).isEqualTo(LocalDate.of(2026, 11, 22));
    }

    @Test
    void 서버가_UTC여도_한국_시간으로_주를_정한다() {
        // UTC 일요일 15:30 = 한국 월요일 00:30
        RankingWeek week = RankingWeek.containing(ZonedDateTime.of(2026, 11, 22, 15, 30, 0, 0, UTC));

        assertThat(week.startDate()).isEqualTo(LocalDate.of(2026, 11, 23));
    }

    @Test
    void 주_경계를_서버_시간대의_시각으로_바꾼다() {
        RankingWeek week = new RankingWeek(LocalDate.of(2026, 11, 23), LocalDate.of(2026, 11, 29));

        assertThat(week.startAt(SEOUL)).isEqualTo(LocalDateTime.of(2026, 11, 23, 0, 0));
        assertThat(week.endAt(SEOUL)).isEqualTo(LocalDateTime.of(2026, 11, 30, 0, 0));
        assertThat(week.startAt(UTC)).isEqualTo(LocalDateTime.of(2026, 11, 22, 15, 0));
        assertThat(week.endAt(UTC)).isEqualTo(LocalDateTime.of(2026, 11, 29, 15, 0));
    }
}
