package com.chaekdami.reward.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class UserBuffTest {

    private static final int MINUTE = 60;
    private static final LocalDateTime ENDED_AT = LocalDateTime.of(2026, 11, 24, 21, 0);

    private static UserBuff buff(LocalDateTime startAt, int remainingMinutes) {
        return UserBuff.builder().userId(1L).buffActivated(true)
                .buffStartAt(startAt).remainingSeconds(remainingMinutes * MINUTE).build();
    }

    private static int consume(int readingMinutes, UserBuff... buffs) {
        return UserBuff.consume(List.of(buffs), ENDED_AT, readingMinutes * MINUTE);
    }

    @Test
    void 독서가_남은_시간보다_길면_남은_시간만큼만_적용한다() {
        UserBuff buff = buff(ENDED_AT.minusMinutes(45), 30);

        assertThat(consume(45, buff)).isEqualTo(30 * MINUTE);
        assertThat(buff.getRemainingSeconds()).isZero();
    }

    @Test
    void 독서가_남은_시간보다_짧으면_나머지는_다음_독서에_남는다() {
        UserBuff buff = buff(ENDED_AT.minusMinutes(20), 30);

        assertThat(consume(20, buff)).isEqualTo(20 * MINUTE);
        assertThat(buff.getRemainingSeconds()).isEqualTo(10 * MINUTE);
    }

    @Test
    void 부스터를_켜고_오래_멈췄다가_읽어도_읽은_시간에만_쓴다() {
        // 40분 독서, 중간에 1시간 일시정지
        UserBuff buff = buff(ENDED_AT.minusMinutes(100), 30);

        assertThat(consume(40, buff)).isEqualTo(30 * MINUTE);
    }

    @Test
    void 며칠_전에_켠_부스터도_남은_시간이_있으면_적용한다() {
        UserBuff buff = buff(ENDED_AT.minusDays(3), 30);

        assertThat(consume(10, buff)).isEqualTo(10 * MINUTE);
        assertThat(buff.getRemainingSeconds()).isEqualTo(20 * MINUTE);
    }

    @Test
    void 독서_도중에_켜면_켠_뒤_지난_시간까지만_적용한다() {
        // 45분 독서 중 20분째에 켬
        UserBuff buff = buff(ENDED_AT.minusMinutes(25), 30);

        assertThat(consume(45, buff)).isEqualTo(25 * MINUTE);
        assertThat(buff.getRemainingSeconds()).isEqualTo(5 * MINUTE);
    }

    @Test
    void 독서가_끝난_뒤에_켠_부스터는_적용하지_않는다() {
        UserBuff buff = buff(ENDED_AT.plusMinutes(1), 30);

        assertThat(consume(45, buff)).isZero();
        assertThat(buff.getRemainingSeconds()).isEqualTo(30 * MINUTE);
    }

    @Test
    void 여러_개면_켠_순서대로_각자_켠_뒤의_시간까지만_적용한다() {
        // 어제 5분 남긴 부스터 + 45분 독서 중 40분째에 하나 더 켬
        UserBuff first = buff(ENDED_AT.minusDays(1), 5);
        UserBuff second = buff(ENDED_AT.minusMinutes(5), 30);

        assertThat(consume(45, first, second)).isEqualTo(10 * MINUTE);
        assertThat(first.getRemainingSeconds()).isZero();
        assertThat(second.getRemainingSeconds()).isEqualTo(25 * MINUTE);
    }

    @Test
    void 여러_개여도_독서_시간보다_많이_적용하지_않는다() {
        UserBuff first = buff(ENDED_AT.minusHours(2), 30);
        UserBuff second = buff(ENDED_AT.minusHours(2), 30);

        assertThat(consume(40, first, second)).isEqualTo(40 * MINUTE);
        assertThat(second.getRemainingSeconds()).isEqualTo(20 * MINUTE);
    }

    @Test
    void 비활성_부스터와_남은_시간이_없는_옛_기록은_적용하지_않는다() {
        UserBuff inactive = UserBuff.builder().userId(1L).buffActivated(false)
                .buffStartAt(ENDED_AT.minusHours(1)).remainingSeconds(30 * MINUTE).build();
        UserBuff old = UserBuff.builder().userId(1L).buffActivated(true)
                .buffStartAt(ENDED_AT.minusMinutes(10)).build();

        assertThat(consume(40, inactive, old)).isZero();
    }
}
