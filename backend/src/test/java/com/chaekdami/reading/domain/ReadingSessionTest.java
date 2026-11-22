package com.chaekdami.reading.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReadingSessionTest {

    private static final LocalDateTime ENDED_AT = LocalDateTime.of(2026, 11, 22, 21, 0);

    private final ReadingRecord record = ReadingRecord.start(
            new Book(1L, null, "테스트 책", "저자", null, null, null, null, null, 300), 1);

    @Test
    void 최소_독서_시간은_프론트와_같은_3분이다() {
        assertThat(ReadingSession.MIN_SECONDS).isEqualTo(180);
    }

    @ParameterizedTest
    @ValueSource(ints = {179, 1, 0, -1})
    void 독서_시간이_3분_미만이면_예외(int durationSeconds) {
        assertThatThrownBy(() -> ReadingSession.of(record, durationSeconds, 0, 10, ENDED_AT))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("독서 시간은 3분 이상이어야 합니다.");
    }

    @Test
    void 독서_시간이_정확히_3분이면_생성된다() {
        ReadingSession session = ReadingSession.of(record, 180, 0, 10, ENDED_AT);

        assertThat(session.getDurationSeconds()).isEqualTo(180);
    }

    @Test
    void 독서_시간이_정확히_2시간이면_생성된다() {
        ReadingSession session = ReadingSession.of(record, 7200, 0, 10, ENDED_AT);

        assertThat(session.getDurationSeconds()).isEqualTo(7200);
    }

    @Test
    void 독서_시간이_2시간을_넘으면_예외() {
        assertThatThrownBy(() -> ReadingSession.of(record, 7201, 0, 10, ENDED_AT))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("한 번의 독서 시간은 최대 2시간입니다.");
    }

    @Test
    void 시작_시각은_종료_시각에서_독서_시간을_뺀_값이다() {
        ReadingSession session = ReadingSession.of(record, 1800, 0, 10, ENDED_AT);

        assertThat(session.getEndedAt()).isEqualTo(ENDED_AT);
        assertThat(session.getStartedAt()).isEqualTo(ENDED_AT.minusSeconds(1800));
    }
}
