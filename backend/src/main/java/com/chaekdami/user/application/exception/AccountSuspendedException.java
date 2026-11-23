package com.chaekdami.user.application.exception;

import com.chaekdami.global.error.BusinessException;
import com.chaekdami.user.domain.UserErrorCode;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 정지된 회원이 올바른 비밀번호로 로그인했을 때. 응답에 정지 끝 시각을 함께 준다 (무기한이면 null).
 */
@Getter
public class AccountSuspendedException extends BusinessException {

    private final LocalDateTime suspendedUntil;

    public AccountSuspendedException(LocalDateTime suspendedUntil) {
        super(UserErrorCode.ACCOUNT_SUSPENDED);
        this.suspendedUntil = suspendedUntil;
    }
}
