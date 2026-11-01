package com.chaekdami.reward.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 보상 파트 전용 에러 코드 (BE2 공통 규약)
 */
@Getter
@RequiredArgsConstructor
public enum RewardErrorCode {

    INSUFFICIENT_CURRENCY("REWARD_001", 400, "보유하신 재화가 부족합니다."),
    REWARD_ACCOUNT_NOT_FOUND("REWARD_004", 404, "사용자의 보상 계정 정보를 찾을 수 없습니다."),
    QUEST_NOT_COMPLETED("QUEST_001", 400, "아직 달성하지 못한 퀘스트입니다."),
    QUEST_ALREADY_REWARDED("QUEST_002", 400, "이미 보상을 수령한 퀘스트입니다."),
    QUEST_NOT_FOUND("QUEST_003", 404, "퀘스트를 찾을 수 없습니다."),
    SHOP_ITEM_NOT_FOUND("SHOP_001", 404, "판매 중인 상품을 찾을 수 없습니다."),
    CONCURRENT_REQUEST("CONCURRENCY_001", 409, "현재 요청이 동시에 여러 번 인입되었습니다. 잠시 후 다시 시도해 주세요.");

    private final String code;
    private final int status;
    private final String message;
}
