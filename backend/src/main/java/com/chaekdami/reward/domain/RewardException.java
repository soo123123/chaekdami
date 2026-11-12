package com.chaekdami.reward.domain;

import lombok.Getter;

/**
 * 보상 도메인 규칙 위반 예외. 글로벌 예외 핸들러에서 errorCode 로 응답을 만든다.
 */
@Getter
public class RewardException extends RuntimeException {

    private final RewardErrorCode errorCode;

    public RewardException(RewardErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
