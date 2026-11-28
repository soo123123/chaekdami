package com.chaekdami.reminder.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 알림의 날짜·주는 서버 시간대와 상관없이 한국 시간으로 나눈다. (스펙 014 R4.3, R8.2)
 */
class ReminderWeekTest {

    private static final ZoneId SEOUL = ReminderWeek.ZONE;
    private static final ZoneId UTC = ZoneOffset.UTC;

    @Test
    void 일요일_23시_59분은_그_주의_마지막_날이다() {
        ReminderWeek week = ReminderWeek.containing(ZonedDateTime.of(2026, 11, 29, 23, 59, 0, 0, SEOUL));

        assertThat(week.today()).isEqualTo(LocalDate.of(2026, 11, 29));
        assertThat(week.weekStart()).isEqualTo(LocalDate.of(2026, 11, 23));
    }

    @Test
    void 월요일_0시는_새_주의_첫날이다() {
        ReminderWeek week = ReminderWeek.containing(ZonedDateTime.of(2026, 11, 30, 0, 0, 0, 0, SEOUL));

        assertThat(week.today()).isEqualTo(LocalDate.of(2026, 11, 30));
        assertThat(week.weekStart()).isEqualTo(LocalDate.of(2026, 11, 30));
    }

    @Test
    void 서버가_UTC여도_한국_날짜로_오늘을_정한다() {
        // UTC 일요일 15시 30분 = 한국 월요일 0시 30분
        ReminderWeek week = ReminderWeek.containing(ZonedDateTime.of(2026, 11, 29, 15, 30, 0, 0, UTC));

        assertThat(week.today()).isEqualTo(LocalDate.of(2026, 11, 30));
        assertThat(week.weekStart()).isEqualTo(LocalDate.of(2026, 11, 30));
    }

    @Test
    void 주_경계를_서버_시간대의_시각으로_바꾼다() {
        ReminderWeek week = new ReminderWeek(LocalDate.of(2026, 11, 28), LocalDate.of(2026, 11, 23));

        assertThat(week.weekStartAt(SEOUL)).isEqualTo(LocalDateTime.of(2026, 11, 23, 0, 0));
        assertThat(week.weekEndAt(SEOUL)).isEqualTo(LocalDateTime.of(2026, 11, 30, 0, 0));
        assertThat(week.weekStartAt(UTC)).isEqualTo(LocalDateTime.of(2026, 11, 22, 15, 0));
        assertThat(week.weekEndAt(UTC)).isEqualTo(LocalDateTime.of(2026, 11, 29, 15, 0));
    }

    @Test
    void 서버_시각을_한국_날짜로_바꾼다() {
        assertThat(ReminderWeek.koreanDateOf(LocalDateTime.of(2026, 11, 28, 15, 30), UTC))
                .isEqualTo(LocalDate.of(2026, 11, 29));
        assertThat(ReminderWeek.koreanDateOf(LocalDateTime.of(2026, 11, 28, 23, 59), SEOUL))
                .isEqualTo(LocalDate.of(2026, 11, 28));
    }
}
