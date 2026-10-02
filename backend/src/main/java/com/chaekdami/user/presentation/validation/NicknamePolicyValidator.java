package com.chaekdami.user.presentation.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class NicknamePolicyValidator implements ConstraintValidator<NicknamePolicy, String> {

    static final int MIN_LENGTH = 2;
    static final int MAX_LENGTH = 16;
    private static final String ALLOWED = "^[A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ]+$";

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }
        String trimmed = value.trim();
        if (trimmed.length() < MIN_LENGTH || trimmed.length() > MAX_LENGTH) {
            return fail(context, "닉네임은 앞뒤 공백을 제외하고 2자 이상 16자 이하여야 합니다.");
        }
        if (!trimmed.matches(ALLOWED)) {
            return fail(context, "닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.");
        }
        return true;
    }

    private static boolean fail(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
        return false;
    }
}
