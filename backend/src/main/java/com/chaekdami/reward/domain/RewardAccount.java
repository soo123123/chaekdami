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

/**
 * 사용자 보상 상태 (User 와 1:1)
 */
@Getter
@Entity
@Table(
        name = "reward_accounts",
        uniqueConstraints = @UniqueConstraint(name = "uk_reward_accounts_user_id", columnNames = "user_id")
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RewardAccount extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "currency", nullable = false)
    private Integer currency;

    @Column(name = "experience", nullable = false)
    private Integer experience;

    @Column(name = "level", nullable = false)
    private Integer level;

    @Column(name = "dday", nullable = false)
    private Integer dday;

    @Column(name = "max_dday", nullable = false)
    private Integer maxDday;

    @Builder
    private RewardAccount(Long userId) {
        this.userId = userId;
        this.currency = 0;
        this.experience = 0;
        this.level = 1;
        this.dday = 0;
        this.maxDday = 0;
    }

    public void addCurrency(int amount) {
        validatePositive(amount);
        this.currency += amount;
    }

    public void deductCurrency(int amount) {
        validatePositive(amount);
        if (this.currency < amount) {
            throw new IllegalStateException("보유 재화가 부족합니다. (보유: " + this.currency + ", 필요: " + amount + ")");
        }
        this.currency -= amount;
    }

    public void addExperience(int amount) {
        validatePositive(amount);
        this.experience += amount;
    }

    private void validatePositive(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("amount 는 0보다 커야 합니다. (입력: " + amount + ")");
        }
    }
}
