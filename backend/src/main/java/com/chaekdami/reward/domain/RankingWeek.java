package com.chaekdami.reward.domain;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.TemporalAdjusters;

/**
 * 주간 랭킹의 한 주. 한국 시간 월요일 0시 ~ 다음 월요일 0시 직전.
 * 서버 시간대와 상관없이 한국 시간으로 경계를 정한다. (스펙 005 R3.1, R3.7)
 *
 * @param startDate 월요일 (한국 날짜)
 * @param endDate   일요일 (한국 날짜)
 */
public record RankingWeek(LocalDate startDate, LocalDate endDate) {

    public static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    /**
     * 주어진 순간이 속한 주
     */
    public static RankingWeek containing(ZonedDateTime moment) {
        LocalDate today = moment.withZoneSameInstant(ZONE).toLocalDate();
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return new RankingWeek(monday, monday.plusDays(6));
    }

    /**
     * 주 시작 순간을 서버 시각으로 바꾼다. (포함)
     * reward_transactions.created_at 은 서버 기본 시간대의 LocalDateTime 으로 저장되므로, 같은 시간대로 바꿔서 비교한다.
     */
    public LocalDateTime startAt(ZoneId serverZone) {
        return toServerTime(startDate, serverZone);
    }

    /**
     * 다음 주 시작 순간을 서버 시각으로 바꾼다. (미포함)
     */
    public LocalDateTime endAt(ZoneId serverZone) {
        return toServerTime(endDate.plusDays(1), serverZone);
    }

    private static LocalDateTime toServerTime(LocalDate koreanDate, ZoneId serverZone) {
        return koreanDate.atStartOfDay(ZONE).withZoneSameInstant(serverZone).toLocalDateTime();
    }
}
