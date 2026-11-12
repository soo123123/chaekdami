package com.chaekdami.reward.application;

import java.time.LocalDateTime;

/**
 * 홈/보상 화면용 보상 상태 통합 조회 결과
 *
 * @param currentExperience   현재 레벨 구간에서 쌓은 경험치
 * @param nextLevelExperience 다음 레벨까지 필요한 구간 경험치
 * @param expBuffExpiredAt    적용 중인 버프가 없으면 null
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
        LocalDateTime expBuffExpiredAt
) {
}
