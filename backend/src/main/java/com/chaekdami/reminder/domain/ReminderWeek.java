package com.chaekdami.reminder.domain;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;

/**
 * 알림용 날짜 기준. 서버 시간대와 상관없이 한국 날짜로 오늘과 주(월요일 시작)를 정한다. (스펙 014 R4.3, R8.2)
 *
 * @param today     오늘 (한국 날짜)
 * @param weekStart 이번 주 월요일 (한국 날짜)
 */
public record ReminderWeek(LocalDate today, LocalDate weekStart) {

    public static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    public static ReminderWeek containing(ZonedDateTime moment) {
        LocalDate today = moment.withZoneSameInstant(ZONE).toLocalDate();
        return new ReminderWeek(today, today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)));
    }

    /**
     * 이번 주 시작 순간을 서버 시각으로 (포함)
     */
    public LocalDateTime weekStartAt(ZoneId serverZone) {
        return toServerTime(weekStart, serverZone);
    }

    /**
     * 다음 주 시작 순간을 서버 시각으로 (미포함)
     */
    public LocalDateTime weekEndAt(ZoneId serverZone) {
        return toServerTime(weekStart.plusDays(7), serverZone);
    }

    /**
     * DB에 서버 시간대의 로컬 시각으로 저장된 값이 한국 날짜로 어느 날인지
     */
    public static LocalDate koreanDateOf(LocalDateTime serverTime, ZoneId serverZone) {
        return serverTime.atZone(serverZone).withZoneSameInstant(ZONE).toLocalDate();
    }

    private static LocalDateTime toServerTime(LocalDate koreanDate, ZoneId serverZone) {
        return koreanDate.atStartOfDay(ZONE).withZoneSameInstant(serverZone).toLocalDateTime();
    }
}
