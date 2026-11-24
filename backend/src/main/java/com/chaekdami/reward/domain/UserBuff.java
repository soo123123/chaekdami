package com.chaekdami.reward.domain;

import com.chaekdami.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 경험치 부스터 1개의 효과. 시각이 아니라 책을 읽은 시간만큼 남은 시간이 줄어든다. (스펙 009)
 * 남은 시간이 없는(null) 행은 만료 시각을 쓰던 옛 기록이라 적용하지 않는다.
 */
@Getter
@Entity
@Table(name = "user_buffs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserBuff extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "is_buff_activated", nullable = false)
    private Boolean buffActivated;

    /** 부스터를 켠 시각 */
    @Column(name = "buff_start_at")
    private LocalDateTime buffStartAt;

    /** 남은 부스터 시간(초) */
    @Column(name = "remaining_seconds")
    private Integer remainingSeconds;

    @Builder
    private UserBuff(Long userId, Boolean buffActivated, LocalDateTime buffStartAt, Integer remainingSeconds) {
        this.userId = userId;
        this.buffActivated = buffActivated != null ? buffActivated : false;
        this.buffStartAt = buffStartAt;
        this.remainingSeconds = remainingSeconds;
    }

    /**
     * 독서 1회에 부스터를 켠 순서대로 적용하고, 적용한 만큼 각 부스터의 남은 시간을 줄인다.
     *
     * @param buffs           켠 순서로 정렬된 부스터
     * @param sessionEndedAt  독서 세션 종료(저장) 시각. 그 뒤에 켠 부스터는 적용하지 않는다
     * @param durationSeconds 독서 시간(초). 일시정지한 시간은 들어 있지 않다
     * @return 부스터가 적용된 시간(초)
     */
    public static int consume(List<UserBuff> buffs, LocalDateTime sessionEndedAt, int durationSeconds) {
        int applied = 0;
        for (UserBuff buff : buffs) {
            applied += buff.consume(sessionEndedAt, durationSeconds - applied);
        }
        return applied;
    }

    /**
     * 남은 시간, 켠 뒤 세션 종료까지 지난 시간, 아직 부스터가 적용되지 않은 독서 시간 중 가장 작은 만큼 쓴다.
     */
    private int consume(LocalDateTime sessionEndedAt, int unboostedSeconds) {
        if (!Boolean.TRUE.equals(buffActivated) || buffStartAt == null || remainingSeconds == null) {
            return 0;
        }
        long sinceActivated = Duration.between(buffStartAt, sessionEndedAt).getSeconds();
        int used = (int) Math.max(0, Math.min(Math.min(remainingSeconds, unboostedSeconds), sinceActivated));
        this.remainingSeconds -= used;
        return used;
    }
}
