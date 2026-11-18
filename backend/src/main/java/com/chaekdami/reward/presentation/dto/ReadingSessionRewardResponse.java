package com.chaekdami.reward.presentation.dto;

import com.chaekdami.reward.application.ReadingSessionRewardResult;

import java.util.List;

/**
 * 독서 완료 화면 보상 응답 ([BE2] 독서 인증 사진 추가 보상 요구사항 3.4 형식)
 *
 * @param baseGranted 이번 요청에서 기본 보상을 처리했는지. 이미 받은 세션이면 false (reading.experience = 0)
 */
public record ReadingSessionRewardResponse(
        Long readingSessionId,
        boolean baseGranted,
        Reading reading,
        PhotoBonus photoBonus,
        List<CompletedQuest> completedQuests,
        Streak streak,
        int promotionReward,
        int levelBefore,
        int level,
        boolean leveledUp,
        int currency
) {

    public static ReadingSessionRewardResponse from(ReadingSessionRewardResult result) {
        return new ReadingSessionRewardResponse(
                result.readingSessionId(),
                result.baseGranted(),
                new Reading(result.reading().experience(), result.reading().boosted()),
                new PhotoBonus(result.photoBonus().granted(), result.photoBonus().experience(),
                        result.photoBonus().currency()),
                result.completedQuests().stream()
                        .map(quest -> new CompletedQuest(quest.userQuestId(), quest.title(),
                                quest.rewardCurrency(), quest.rewardExperience()))
                        .toList(),
                new Streak(result.streak().currentStreak(), result.streak().longestStreak(),
                        result.streak().shieldsUsed()),
                result.promotionReward(),
                result.levelBefore(),
                result.level(),
                result.leveledUp(),
                result.currency()
        );
    }

    public record Reading(int experience, boolean boosted) {
    }

    public record PhotoBonus(boolean granted, int experience, int currency) {
    }

    public record Streak(int currentStreak, int longestStreak, int shieldsUsed) {
    }

    public record CompletedQuest(Long userQuestId, String title, int rewardCurrency, int rewardExperience) {
    }
}
