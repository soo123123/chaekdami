package com.chaekdami.reward.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class UserBuffTest {

    private static final LocalDateTime FROM = LocalDateTime.of(2026, 11, 22, 20, 0);
    private static final LocalDateTime TO = FROM.plusMinutes(60);

    private static UserBuff buff(LocalDateTime start, LocalDateTime end) {
        return UserBuff.builder().userId(1L).buffActivated(true).buffStartAt(start).buffEndAt(end).build();
    }

    @Test
    void 독서_중_마지막_20분만_적용() {
        UserBuff buff = buff(FROM.plusMinutes(40), FROM.plusMinutes(70));

        assertThat(UserBuff.overlapSeconds(List.of(buff), FROM, TO)).isEqualTo(20 * 60);
    }

    @Test
    void 독서_시작_전에_켜서_중간에_끝남() {
        UserBuff buff = buff(FROM.minusMinutes(10), FROM.plusMinutes(20));

        assertThat(UserBuff.overlapSeconds(List.of(buff), FROM, TO)).isEqualTo(20 * 60);
    }

    @Test
    void 독서_전체에_적용() {
        UserBuff buff = buff(FROM.minusMinutes(5), TO.plusMinutes(5));

        assertThat(UserBuff.overlapSeconds(List.of(buff), FROM, TO)).isEqualTo(60 * 60);
    }

    @Test
    void 겹치는_버프는_한_번만_센다() {
        UserBuff first = buff(FROM, FROM.plusMinutes(30));
        UserBuff second = buff(FROM.plusMinutes(20), FROM.plusMinutes(40));

        assertThat(UserBuff.overlapSeconds(List.of(second, first), FROM, TO)).isEqualTo(40 * 60);
    }

    @Test
    void 비활성_버프와_구간_밖_버프는_제외() {
        UserBuff inactive = UserBuff.builder().userId(1L).buffActivated(false)
                .buffStartAt(FROM).buffEndAt(TO).build();
        UserBuff before = buff(FROM.minusMinutes(30), FROM);

        assertThat(UserBuff.overlapSeconds(List.of(inactive, before), FROM, TO)).isZero();
    }
}
