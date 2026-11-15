package com.chaekdami.reward.application;

/**
 * 독서 세션 완료로 지급된 보상
 *
 * @param experience      지급한 경험치 (부스터 적용 후)
 * @param boosted         경험치 부스터가 적용됐는지
 * @param promotionReward 레벨업으로 받은 승급 보상 재화 (레벨업이 없으면 0)
 */
public record ReadingRewardResult(
        int experience,
        boolean boosted,
        int promotionReward,
        int level
) {
}
