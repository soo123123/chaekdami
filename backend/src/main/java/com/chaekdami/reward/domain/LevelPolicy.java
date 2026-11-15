package com.chaekdami.reward.domain;

/**
 * 레벨업 필요 경험치와 승급 보상 재화 규칙
 */
public final class LevelPolicy {

    /**
     * index 0 = Lv.1 -> Lv.2, index 18 = Lv.19 -> Lv.20 에 필요한 경험치.
     * 80 에서 450 까지 선형 증가 (5 단위 반올림).
     */
    private static final int[] REQUIRED_EXPERIENCE = {
            80, 100, 120, 140, 160, 185, 205, 225, 245, 265,
            285, 305, 325, 345, 370, 390, 410, 430, 450
    };

    /** Lv.20 이상 구간의 레벨당 필요 경험치 */
    private static final int MAX_TIER_REQUIRED_EXPERIENCE = 450;

    private LevelPolicy() {
    }

    /**
     * level 에서 level + 1 로 오르는 데 필요한 경험치
     */
    public static int requiredExperience(int level) {
        validateLevel(level);
        if (level <= REQUIRED_EXPERIENCE.length) {
            return REQUIRED_EXPERIENCE[level - 1];
        }
        return MAX_TIER_REQUIRED_EXPERIENCE;
    }

    /**
     * Lv.1 에서 level 에 도달하기까지 필요한 누적 경험치 (Lv.1 = 0)
     */
    public static int totalExperienceToReach(int level) {
        validateLevel(level);
        int total = 0;
        for (int current = 1; current < level; current++) {
            total += requiredExperience(current);
        }
        return total;
    }

    /**
     * reachedLevel 에 도달했을 때 지급하는 승급 보상 재화
     * - 1의 자리가 0인 레벨: 1,000 / 1의 자리가 5인 레벨: 500 (만렙 구간 포함)
     * - 그 외 Lv.2~9: 100, Lv.11~19: 150, Lv.21 이상: 200
     */
    public static int promotionReward(int reachedLevel) {
        if (reachedLevel < 2) {
            throw new IllegalArgumentException("승급 레벨은 2 이상이어야 합니다. (입력: " + reachedLevel + ")");
        }
        if (reachedLevel % 10 == 0) {
            return 1_000;
        }
        if (reachedLevel % 10 == 5) {
            return 500;
        }
        if (reachedLevel < 10) {
            return 100;
        }
        if (reachedLevel < 20) {
            return 150;
        }
        return 200;
    }

    private static void validateLevel(int level) {
        if (level < 1) {
            throw new IllegalArgumentException("레벨은 1 이상이어야 합니다. (입력: " + level + ")");
        }
    }
}
