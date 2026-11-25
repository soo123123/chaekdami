package com.chaekdami.reward.domain;

public enum TransactionReason {
    /**
     * 퀘스트 보상. 일일과 주간이 함께 쓰고, 구분은 reference_id(user_quests.id)로 한다.
     * (값을 새로 추가하면 오래된 DB 의 제약 때문에 저장이 실패할 수 있다)
     */
    DAILY_QUEST,
    SHOP_PURCHASE,
    READING_COMPLETE,
    LEVEL_UP,
    /** 책 사진으로 인증된 독서 세션의 추가 보상 */
    PHOTO_CERTIFICATION
}
