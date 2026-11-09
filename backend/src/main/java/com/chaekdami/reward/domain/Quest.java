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
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Objects;

/**
 * 퀘스트 마스터
 */
@Getter
@Entity
@Table(
        name = "quests",
        uniqueConstraints = @UniqueConstraint(name = "uk_quests_code", columnNames = "code")
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Quest extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 퀘스트 고유 코드 (DailyQuest 의 상수 이름). 진행도 계산 기준을 이 코드로 찾는다.
     * 코드 컬럼이 생기기 전에 만들어진 행이 있을 수 있어 nullable 로 두고, 시더가 채운다.
     */
    @Column(name = "code", length = 50)
    private String code;

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
    private Quest(String code, QuestType type, String title, Integer targetValue,
                  Integer rewardCurrency, Integer rewardExperience) {
        this.code = code;
        this.type = type;
        this.title = title;
        this.targetValue = targetValue;
        this.rewardCurrency = rewardCurrency != null ? rewardCurrency : 0;
        this.rewardExperience = rewardExperience != null ? rewardExperience : 0;
    }

    /**
     * 코드가 없는 기존 행에 코드를 붙인다.
     */
    public void assignCode(String code) {
        this.code = code;
    }

    /**
     * 퀘스트 정의(종류, 제목, 목표, 보상)를 주어진 값으로 맞춘다.
     *
     * @return 바뀐 값이 있으면 true
     */
    public boolean changeDefinition(QuestType type, String title, int targetValue,
                                    int rewardCurrency, int rewardExperience) {
        boolean changed = this.type != type
                || !Objects.equals(this.title, title)
                || this.targetValue != targetValue
                || this.rewardCurrency != rewardCurrency
                || this.rewardExperience != rewardExperience;
        this.type = type;
        this.title = title;
        this.targetValue = targetValue;
        this.rewardCurrency = rewardCurrency;
        this.rewardExperience = rewardExperience;
        return changed;
    }
}
