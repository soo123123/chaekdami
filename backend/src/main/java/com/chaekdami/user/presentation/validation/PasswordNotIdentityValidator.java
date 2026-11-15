package com.chaekdami.user.presentation.validation;

import com.chaekdami.user.presentation.dto.SignUpRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordNotIdentityValidator implements ConstraintValidator<PasswordNotIdentity, SignUpRequest> {

    @Override
    public boolean isValid(SignUpRequest request, ConstraintValidatorContext context) {
        if (request == null || request.getPassword() == null || request.getPassword().isBlank()) {
            return true;
        }

        String password = request.getPassword();
        boolean matchesEmailId = matchesEmailId(password, request.getEmail());
        boolean matchesNickname = request.getNickname() != null
                && password.equalsIgnoreCase(request.getNickname().trim());
        if (!matchesEmailId && !matchesNickname) {
            return true;
        }

        context.disableDefaultConstraintViolation();
        if (matchesEmailId) {
            addViolation(context, "비밀번호는 이메일 아이디와 같을 수 없습니다.");
        }
        if (matchesNickname) {
            addViolation(context, "비밀번호는 닉네임과 같을 수 없습니다.");
        }
        return false;
    }

    private static boolean matchesEmailId(String password, String email) {
        if (email == null) {
            return false;
        }
        int at = email.indexOf('@');
        if (at <= 0) {
            return false;
        }
        return password.equalsIgnoreCase(email.substring(0, at).trim());
    }

    private static void addViolation(ConstraintValidatorContext context, String message) {
        context.buildConstraintViolationWithTemplate(message)
                .addPropertyNode("password")
                .addConstraintViolation();
    }
}
