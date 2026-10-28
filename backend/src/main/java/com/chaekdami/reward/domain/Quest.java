package com.chaekdami.reward.domain;

import com.chaekdami.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 퀘스트 마스터
 */
@Getter
@Entity
@Table(name = "quests")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Quest extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private QuestType type;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "target_value", nullable = false)
    private Integer targetValue;

    @Column(name = "reward_currency", nullable = false)
    private Integer rewardCurrency;

    @Column(name = "reward_experience", nullable = false)
    private Integer rewardExperience;

    @Builder
    private Quest(QuestType type, String title, Integer targetValue, Integer rewardCurrency, Integer rewardExperience) {
        this.type = type;
        this.title = title;
        this.targetValue = targetValue;
        this.rewardCurrency = rewardCurrency != null ? rewardCurrency : 0;
        this.rewardExperience = rewardExperience != null ? rewardExperience : 0;
    }
}
