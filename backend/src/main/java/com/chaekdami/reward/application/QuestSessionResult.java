package com.chaekdami.reward.application;

import java.util.List;

/**
 * 독서 세션 1회를 오늘의 퀘스트에 반영한 결과
 *
 * @param quests   반영 후 오늘의 퀘스트 목록
 * @param rewarded 이번 세션으로 달성해 자동 지급된 퀘스트 보상 (없으면 빈 목록)
 */
public record QuestSessionResult(
        List<QuestResult> quests,
        List<QuestRewardResult> rewarded
) {
}
