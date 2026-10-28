package com.chaekdami.reward.domain;

import com.chaekdami.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 스트릭 기록 (사용자별 하루 1건)
 */
@Getter
@Entity
@Table(
        name = "streak_logs",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_streak_logs_user_id_achieved_date",
                columnNames = {"user_id", "achieved_date"}
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StreakLog extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "achieved_date", nullable = false)
    private LocalDate achievedDate;

    @Column(name = "is_shield_used", nullable = false)
    private Boolean shieldUsed;

    @Builder
    private StreakLog(Long userId, LocalDate achievedDate, Boolean shieldUsed) {
        this.userId = userId;
        this.achievedDate = achievedDate;
        this.shieldUsed = shieldUsed != null ? shieldUsed : false;
    }
}
