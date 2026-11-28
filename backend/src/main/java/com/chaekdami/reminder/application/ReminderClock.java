package com.chaekdami.reminder.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * 알림 조회의 현재 시각과 서버 시간대. 테스트에서 고정 시각을 넣는다.
 */
@Component
public class ReminderClock {

    private final Clock clock;

    @Autowired
    public ReminderClock() {
        this(Clock.systemDefaultZone());
    }

    public ReminderClock(Clock clock) {
        this.clock = clock;
    }

    public ZonedDateTime now() {
        return ZonedDateTime.now(clock);
    }

    /** DB의 시각 컬럼이 저장된 시간대 */
    public ZoneId serverZone() {
        return clock.getZone();
    }
}
