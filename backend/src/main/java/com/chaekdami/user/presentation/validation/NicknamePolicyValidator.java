package com.chaekdami.user.presentation.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class NicknamePolicyValidator implements ConstraintValidator<NicknamePolicy, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        String message = NicknameRules.violationMessage(value);
        if (message == null) {
            return true;
        }
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
        return false;
    }
}
