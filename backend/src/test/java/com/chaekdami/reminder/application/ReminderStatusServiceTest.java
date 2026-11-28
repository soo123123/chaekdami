package com.chaekdami.reminder.application;

import com.chaekdami.reminder.application.port.ReminderReadingReader;
import com.chaekdami.reminder.application.port.ReminderReadingReader.EndedSession;
import com.chaekdami.reminder.application.port.ReminderStreakReader;
import com.chaekdami.reminder.application.result.ReminderSettingResult;
import com.chaekdami.reminder.application.result.ReminderStatusResult;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 알림용 조회의 계산 (스펙 014 R4.1~R4.4). 다른 도메인은 가짜 포트로 바꾼다.
 */
class ReminderStatusServiceTest {

    private static final Long USER_ID = 7L;
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final List<String> calls = new ArrayList<>();
    private LocalDateTime requestedStart;
    private LocalDateTime requestedEnd;

    @Test
    void 종료_시각으로_오늘과_이번_주를_나누고_초를_더한_뒤_분으로_내린다() {
        // 한국 토요일 2026-11-28 21시, 서버 시간대 한국
        ReminderStatusService service = service(ZonedDateTime.of(2026, 11, 28, 21, 0, 0, 0, SEOUL), List.of(
                new EndedSession(LocalDateTime.of(2026, 11, 24, 10, 0), 600),
                new EndedSession(LocalDateTime.of(2026, 11, 28, 0, 10), 200),   // 자정을 넘겨 끝난 독서는 끝난 날
                new EndedSession(LocalDateTime.of(2026, 11, 28, 9, 0), 230)));

        ReminderStatusResult result = service.get(USER_ID);

        assertThat(requestedStart).isEqualTo(LocalDateTime.of(2026, 11, 23, 0, 0));
        assertThat(requestedEnd).isEqualTo(LocalDateTime.of(2026, 11, 30, 0, 0));
        assertThat(result.today()).isEqualTo(LocalDate.of(2026, 11, 28));
        assertThat(result.weekStart()).isEqualTo(LocalDate.of(2026, 11, 23));
        assertThat(result.readToday()).isTrue();
        assertThat(result.weekReadDates()).containsExactly(LocalDate.of(2026, 11, 24), LocalDate.of(2026, 11, 28));
        assertThat(result.todayMinutes()).isEqualTo(7);    // 430초
        assertThat(result.weekMinutes()).isEqualTo(17);    // 1030초. 세션마다 내리면 16
        assertThat(result.currentStreak()).isEqualTo(4);
        assertThat(result.ownedShieldCount()).isEqualTo(2);
        assertThat(result.nickname()).isEqualTo("책벌레");
        assertThat(result.settings()).isEqualTo(new ReminderSettingResult(true, false, 300));
    }

    @Test
    void 오늘_읽지_않았으면_오늘_값은_0이다() {
        ReminderStatusService service = service(ZonedDateTime.of(2026, 11, 28, 21, 0, 0, 0, SEOUL), List.of(
                new EndedSession(LocalDateTime.of(2026, 11, 27, 23, 50), 600)));

        ReminderStatusResult result = service.get(USER_ID);

        assertThat(result.readToday()).isFalse();
        assertThat(result.todayMinutes()).isZero();
        assertThat(result.weekMinutes()).isEqualTo(10);
    }

    @Test
    void 서버가_UTC여도_한국_날짜_기준으로_조회하고_방어권도_한국_날짜로_처리한다() {
        // UTC 2026-11-28 15:30 = 한국 일요일 2026-11-29 0:30
        ReminderStatusService service = service(ZonedDateTime.of(2026, 11, 28, 15, 30, 0, 0, ZoneOffset.UTC), List.of(
                new EndedSession(LocalDateTime.of(2026, 11, 28, 15, 10), 300)));   // 한국 0:10

        ReminderStatusResult result = service.get(USER_ID);

        assertThat(requestedStart).isEqualTo(LocalDateTime.of(2026, 11, 22, 15, 0));
        assertThat(result.today()).isEqualTo(LocalDate.of(2026, 11, 29));
        assertThat(result.readToday()).isTrue();
        assertThat(calls).containsExactly("settle 2026-11-29");
    }

    private ReminderStatusService service(ZonedDateTime now, List<EndedSession> sessions) {
        ReminderReadingReader reading = (userId, start, end) -> {
            requestedStart = start;
            requestedEnd = end;
            return sessions;
        };
        ReminderStreakReader streak = (userId, today) -> {
            calls.add("settle " + today);
            return new ReminderStreakReader.Streak(4, 2);
        };
        ReminderSettingService settings = mock(ReminderSettingService.class);
        when(settings.get(USER_ID)).thenReturn(ReminderSettingResult.defaults());
        Clock clock = Clock.fixed(now.toInstant(), now.getZone());
        return new ReminderStatusService(new ReminderClock(clock), reading, streak, userId -> "책벌레", settings);
    }
}
