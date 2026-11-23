package com.chaekdami.user.domain;

import com.chaekdami.global.error.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserErrorCode implements ErrorCode {

    CANNOT_MODIFY_SELF(400, "내 계정은 정지하거나 역할을 바꿀 수 없습니다."),
    CANNOT_MODIFY_ADMIN(400, "관리자 계정은 정지하거나 역할을 바꿀 수 없습니다."),
    ACCOUNT_SUSPENDED(403, "이용이 정지된 계정입니다."),
    USER_NOT_FOUND(404, "회원을 찾을 수 없습니다.");

    private final int status;
    private final String message;

    @Override
    public String getCode() {
        return name();
    }
}
