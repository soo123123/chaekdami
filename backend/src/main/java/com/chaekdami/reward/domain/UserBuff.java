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
import java.util.Comparator;
import java.util.List;

/**
 * 실시간 경험치 버프
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

    @Column(name = "buff_start_at")
    private LocalDateTime buffStartAt;

    @Column(name = "buff_end_at")
    private LocalDateTime buffEndAt;

    @Builder
    private UserBuff(Long userId, Boolean buffActivated, LocalDateTime buffStartAt, LocalDateTime buffEndAt) {
        this.userId = userId;
        this.buffActivated = buffActivated != null ? buffActivated : false;
        this.buffStartAt = buffStartAt;
        this.buffEndAt = buffEndAt;
    }

    /**
     * 버프가 활성화되어 있고, now 가 [buffStartAt, buffEndAt) 구간에 있으면 true
     */
    public boolean isBuffActive(LocalDateTime now) {
        if (!Boolean.TRUE.equals(buffActivated) || buffStartAt == null || buffEndAt == null) {
            return false;
        }
        return !now.isBefore(buffStartAt) && now.isBefore(buffEndAt);
    }

    /**
     * 적용 중인 버프의 종료 시각을 duration 만큼 늦춘다. (부스터를 겹쳐 쓴 경우)
     */
    public void extend(Duration duration) {
        this.buffEndAt = this.buffEndAt.plus(duration);
    }

    /**
     * [from, to) 구간 중 버프가 하나라도 적용된 시간(초). 버프끼리 겹치는 시간은 한 번만 센다.
     * 비활성 버프와 시작·종료 시각이 없는 버프는 제외한다.
     */
    public static long overlapSeconds(List<UserBuff> buffs, LocalDateTime from, LocalDateTime to) {
        if (buffs == null || buffs.isEmpty() || !from.isBefore(to)) {
            return 0;
        }
        List<UserBuff> sorted = buffs.stream()
                .filter(buff -> Boolean.TRUE.equals(buff.buffActivated)
                        && buff.buffStartAt != null && buff.buffEndAt != null)
                .sorted(Comparator.comparing(UserBuff::getBuffStartAt))
                .toList();
        long total = 0;
        LocalDateTime coveredUntil = from;
        for (UserBuff buff : sorted) {
            LocalDateTime start = max(buff.buffStartAt, coveredUntil);
            LocalDateTime end = min(buff.buffEndAt, to);
            if (start.isBefore(end)) {
                total += Duration.between(start, end).getSeconds();
                coveredUntil = end;
            }
        }
        return total;
    }

    private static LocalDateTime max(LocalDateTime a, LocalDateTime b) {
        return a.isAfter(b) ? a : b;
    }

    private static LocalDateTime min(LocalDateTime a, LocalDateTime b) {
        return a.isBefore(b) ? a : b;
    }
}
