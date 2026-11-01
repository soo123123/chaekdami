package com.chaekdami.reward.domain;

import com.chaekdami.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 유저별 퀘스트 진행도
 */
@Getter
@Entity
@Table(name = "user_quests")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserQuest extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quest_id", nullable = false)
    private Quest quest;

    @Column(name = "progress", nullable = false)
    private Integer progress;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private QuestStatus status;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Builder
    private UserQuest(Long userId, Quest quest) {
        this.userId = userId;
        this.quest = quest;
        this.progress = 0;
        this.status = QuestStatus.IN_PROGRESS;
    }

    /**
     * 진행도를 val 만큼 증가시킨다. 퀘스트의 목표치에 도달하면 COMPLETED 로 전환한다.
     * 진행 중이 아닌 퀘스트는 무시한다.
     */
    public void updateProgress(int val) {
        if (status != QuestStatus.IN_PROGRESS) {
            return;
        }
        if (val <= 0) {
            throw new IllegalArgumentException("val 은 0보다 커야 합니다. (입력: " + val + ")");
        }
        int targetValue = quest.getTargetValue();
        this.progress = Math.min(this.progress + val, targetValue);
        if (this.progress >= targetValue) {
            this.status = QuestStatus.COMPLETED;
            this.completedAt = LocalDateTime.now();
        }
    }

    /**
     * 완료된 퀘스트의 보상을 수령 처리한다. (COMPLETED -> REWARDED)
     */
    public void claimReward() {
        if (status == QuestStatus.REWARDED) {
            throw new RewardException(RewardErrorCode.QUEST_ALREADY_REWARDED);
        }
        if (status != QuestStatus.COMPLETED) {
            throw new RewardException(RewardErrorCode.QUEST_NOT_COMPLETED);
        }
        this.status = QuestStatus.REWARDED;
    }
}
