package com.chaekdami.review.application;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * 서버 시간대와 관계없이 한국 날짜를 쓴다. DB의 시각 컬럼도 타임존 없는 KST 로컬 시각이다.
 */
@Component
public class KoreanTime {

    public static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    private final Clock clock;

    @Autowired
    public KoreanTime() {
        this(Clock.system(ZONE));
    }

    public KoreanTime(Clock clock) {
        this.clock = clock.withZone(ZONE);
    }

    public LocalDate today() {
        return LocalDate.now(clock);
    }

    public LocalDateTime now() {
        return LocalDateTime.now(clock);
    }
}
