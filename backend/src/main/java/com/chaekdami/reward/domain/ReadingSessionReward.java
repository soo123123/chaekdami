package com.chaekdami.reward.domain;

import com.chaekdami.global.entity.BaseTimeEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 독서 세션 1건으로 받은 완료 화면 보상 기록.
 * 같은 세션으로 완료 보상 API 를 다시 호출하면 이 기록을 그대로 돌려준다. (보상은 다시 지급하지 않음)
 * 지급 자체의 중복 방지는 reward_transactions 이력이 맡고, 이 테이블은 응답을 다시 만들기 위한 것이다.
 */
@Getter
@Entity
@Table(
        name = "reading_session_rewards",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_reading_session_rewards_user_id_reading_session_id",
                columnNames = {"user_id", "reading_session_id"}
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReadingSessionReward extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "reading_session_id", nullable = false)
    private Long readingSessionId;

    @Column(name = "reading_experience", nullable = false)
    private int readingExperience;

    @Column(name = "is_boosted", nullable = false)
    private boolean boosted;

    @Column(name = "photo_bonus_experience", nullable = false)
    private int photoBonusExperience;

    @Column(name = "shields_used", nullable = false)
    private int shieldsUsed;

    @Column(name = "is_shield_refunded", nullable = false)
    private boolean shieldRefunded;

    @Column(name = "promotion_reward", nullable = false)
    private int promotionReward;

    @Column(name = "level_before", nullable = false)
    private int levelBefore;

    @Column(name = "level_after", nullable = false)
    private int levelAfter;

    @ElementCollection
    @CollectionTable(
            name = "reading_session_reward_quests",
            joinColumns = @JoinColumn(
                    name = "reading_session_reward_id",
                    foreignKey = @ForeignKey(name = "fk_reading_session_reward_quests_reading_session_reward_id")
            )
    )
    @OrderColumn(name = "sort_order")
    private List<CompletedQuest> completedQuests = new ArrayList<>();

    private ReadingSessionReward(Long userId, Long readingSessionId, int levelBefore) {
        this.userId = userId;
        this.readingSessionId = readingSessionId;
        this.levelBefore = levelBefore;
        this.levelAfter = levelBefore;
    }

    /**
     * 아직 아무 보상도 기록하지 않은 상태로 만든다. levelBefore 는 첫 지급 직전 레벨이다.
     */
    public static ReadingSessionReward start(Long userId, Long readingSessionId, int levelBefore) {
        return new ReadingSessionReward(userId, readingSessionId, levelBefore);
    }

    /**
     * 기본 보상(독서 경험치, 퀘스트, 방어권 정산)을 기록한다.
     */
    public void recordBase(int readingExperience, boolean boosted, List<CompletedQuest> completedQuests,
                           int shieldsUsed, boolean shieldRefunded, int promotionReward) {
        this.readingExperience = readingExperience;
        this.boosted = boosted;
        this.completedQuests.clear();
        this.completedQuests.addAll(completedQuests);
        this.shieldsUsed = shieldsUsed;
        this.shieldRefunded = shieldRefunded;
        this.promotionReward += promotionReward;
    }

    /**
     * 사진 인증 추가 보상을 기록한다. 기본 보상보다 나중 요청에서 받을 수도 있다.
     */
    public void recordPhotoBonus(int experience, int promotionReward) {
        this.photoBonusExperience = experience;
        this.promotionReward += promotionReward;
    }

    /**
     * 이 세션 보상을 처리한 뒤의 레벨을 기록한다.
     */
    public void recordLevelAfter(int levelAfter) {
        this.levelAfter = levelAfter;
    }

    public boolean hasPhotoBonus() {
        return photoBonusExperience > 0;
    }

    public boolean isLeveledUp() {
        return levelAfter > levelBefore;
    }

    @Getter
    @Embeddable
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    public static class CompletedQuest {

        @Column(name = "user_quest_id", nullable = false)
        private Long userQuestId;

        @Column(name = "title", nullable = false)
        private String title;

        @Column(name = "reward_currency", nullable = false)
        private int rewardCurrency;

        @Column(name = "reward_experience", nullable = false)
        private int rewardExperience;

        public CompletedQuest(Long userQuestId, String title, int rewardCurrency, int rewardExperience) {
            this.userQuestId = userQuestId;
            this.title = title;
            this.rewardCurrency = rewardCurrency;
            this.rewardExperience = rewardExperience;
        }
    }
}
