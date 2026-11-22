package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.LevelPolicy;
import com.chaekdami.reward.domain.RewardAccount;

/**
 * 현재 레벨 구간의 경험치 진행도
 *
 * @param currentExperience   현재 레벨 구간에서 쌓은 경험치
 * @param nextLevelExperience 다음 레벨까지 필요한 구간 경험치
 * @param percentage          currentExperience / nextLevelExperience 백분율 (소수점 버림)
 */
public record ExperienceProgress(int currentExperience, int nextLevelExperience, int percentage) {

    public static ExperienceProgress of(RewardAccount account) {
        int current = account.getExperience() - LevelPolicy.totalExperienceToReach(account.getLevel());
        int next = LevelPolicy.requiredExperience(account.getLevel());
        return new ExperienceProgress(current, next, current * 100 / next);
    }
}
