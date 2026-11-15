package com.chaekdami.user.presentation.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordPolicyValidator implements ConstraintValidator<PasswordPolicy, String> {

    static final String BLOCKED_MESSAGE =
            "비밀번호에 사용할 수 없는 문자가 있습니다. 사용 불가: ' \" ; \\ ` # 및 -- /* */";

    private static final String ALLOWED_SPECIALS = "!$%&()*+,-./:<=>?@[]^_{|}~";
    private static final String BLOCKED_CHARS = "'\";\\`#";

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true;
        }
        if (containsWhitespace(value)) {
            return fail(context, "비밀번호에는 공백을 사용할 수 없습니다.");
        }
        if (containsBlocked(value)) {
            return fail(context, BLOCKED_MESSAGE);
        }
        if (!isAllowedCharset(value)) {
            return fail(context, "비밀번호는 영어 대문자, 영어 소문자, 숫자, 허용된 특수문자만 사용할 수 있습니다.");
        }
        if (categoryCount(value) < 2) {
            return fail(context, "비밀번호는 영어 대문자, 영어 소문자, 숫자, 특수문자 중 2종류 이상을 포함해야 합니다.");
        }
        return true;
    }

    private static boolean fail(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
        return false;
    }

    private static boolean containsWhitespace(String value) {
        return value.codePoints().anyMatch(Character::isWhitespace);
    }

    private static boolean containsBlocked(String value) {
        for (int i = 0; i < value.length(); i++) {
            if (BLOCKED_CHARS.indexOf(value.charAt(i)) >= 0) {
                return true;
            }
        }
        return value.contains("--") || value.contains("/*") || value.contains("*/");
    }

    private static boolean isAllowedCharset(String value) {
        return value.codePoints().allMatch(PasswordPolicyValidator::isAllowed);
    }

    private static boolean isAllowed(int codePoint) {
        return isAsciiUpper(codePoint)
                || isAsciiLower(codePoint)
                || isAsciiDigit(codePoint)
                || (codePoint < 128 && ALLOWED_SPECIALS.indexOf(codePoint) >= 0);
    }

    private static int categoryCount(String value) {
        int categories = 0;
        if (value.codePoints().anyMatch(PasswordPolicyValidator::isAsciiUpper)) {
            categories++;
        }
        if (value.codePoints().anyMatch(PasswordPolicyValidator::isAsciiLower)) {
            categories++;
        }
        if (value.codePoints().anyMatch(PasswordPolicyValidator::isAsciiDigit)) {
            categories++;
        }
        if (value.codePoints().anyMatch(ch -> ch < 128 && ALLOWED_SPECIALS.indexOf(ch) >= 0)) {
            categories++;
        }
        return categories;
    }

    private static boolean isAsciiUpper(int codePoint) {
        return codePoint >= 'A' && codePoint <= 'Z';
    }

    private static boolean isAsciiLower(int codePoint) {
        return codePoint >= 'a' && codePoint <= 'z';
    }

    private static boolean isAsciiDigit(int codePoint) {
        return codePoint >= '0' && codePoint <= '9';
    }
}
