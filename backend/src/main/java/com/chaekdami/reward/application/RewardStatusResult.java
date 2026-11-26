package com.chaekdami.reward.application;

/**
 * 홈/보상 화면용 보상 상태 통합 조회 결과
 *
 * @param currentExperience       현재 레벨 구간에서 쌓은 경험치
 * @param nextLevelExperience     다음 레벨까지 필요한 구간 경험치
 * @param expBuffActive           남은 부스터 시간이 있으면 true
 * @param boosterRemainingSeconds 남은 부스터 시간(초). 책을 읽는 동안에만 줄어든다. 없으면 0
 */
public record RewardStatusResult(
        int level,
        int currentExperience,
        int nextLevelExperience,
        int experiencePercentage,
        int currency,
        int currentStreak,
        int ownedShieldCount,
        boolean expBuffActive,
        int boosterRemainingSeconds
) {
}
