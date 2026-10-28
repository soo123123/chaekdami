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

import java.time.LocalDateTime;

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
}
