package com.chaekdami.reminder.domain;

import com.chaekdami.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

/**
 * 독서 알림 설정. 회원마다 한 행이고, 행이 없으면 기본값으로 본다. (스펙 014 R4.5, R4.6)
 */
@Entity
@Table(name = "reminder_settings",
        uniqueConstraints = @UniqueConstraint(name = "uk_reminder_settings_user_id", columnNames = "user_id"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReminderSetting extends BaseTimeEntity {

    public static final boolean DEFAULT_ENABLED = true;
    public static final boolean DEFAULT_EARLY_LATE_MUTED = false;
    public static final int DEFAULT_WEEKLY_GOAL_MINUTES = 300;
    public static final int MIN_WEEKLY_GOAL_MINUTES = 30;
    public static final int MAX_WEEKLY_GOAL_MINUTES = 3000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ColumnDefault("true")
    @Column(nullable = false)
    private boolean enabled;

    /** 켜면 모든 요일의 이른 아침·늦은 저녁 알림을 보내지 않는다 (R4.8) */
    @ColumnDefault("false")
    @Column(name = "early_late_muted", nullable = false)
    private boolean earlyLateMuted;

    @ColumnDefault("300")
    @Column(name = "weekly_goal_minutes", nullable = false)
    private int weeklyGoalMinutes;

    public static ReminderSetting create(Long userId, boolean enabled, boolean earlyLateMuted, int weeklyGoalMinutes) {
        ReminderSetting setting = new ReminderSetting();
        setting.userId = userId;
        setting.change(enabled, earlyLateMuted, weeklyGoalMinutes);
        return setting;
    }

    public void change(boolean enabled, boolean earlyLateMuted, int weeklyGoalMinutes) {
        if (weeklyGoalMinutes < MIN_WEEKLY_GOAL_MINUTES || weeklyGoalMinutes > MAX_WEEKLY_GOAL_MINUTES) {
            throw new IllegalArgumentException("주간 목표는 " + MIN_WEEKLY_GOAL_MINUTES + "~"
                    + MAX_WEEKLY_GOAL_MINUTES + "분이어야 합니다.");
        }
        this.enabled = enabled;
        this.earlyLateMuted = earlyLateMuted;
        this.weeklyGoalMinutes = weeklyGoalMinutes;
    }
}
