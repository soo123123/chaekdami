package com.chaekdami.reward.domain;

public enum TransactionReason {
    DAILY_QUEST,
    SHOP_PURCHASE,
    READING_COMPLETE,
    LEVEL_UP,
    /** 책 사진으로 인증된 독서 세션의 추가 보상 */
    PHOTO_CERTIFICATION
}
