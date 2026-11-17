package com.chaekdami.reward.domain;

import com.chaekdami.global.error.BusinessException;

/**
 * 보상 도메인 규칙 위반 예외. 공용 BusinessException 이므로 GlobalExceptionHandler 가
 * RewardErrorCode 의 status 와 code, message 로 응답한다. (예: 400 REWARD_001)
 */
public class RewardException extends BusinessException {

    public RewardException(RewardErrorCode errorCode) {
        super(errorCode);
    }

    @Override
    public RewardErrorCode getErrorCode() {
        return (RewardErrorCode) super.getErrorCode();
    }
}
