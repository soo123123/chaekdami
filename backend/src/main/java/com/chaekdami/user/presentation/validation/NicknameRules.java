package com.chaekdami.user.presentation.validation;

public final class NicknameRules {

    private static final int MIN_LENGTH = 2;
    private static final int MAX_LENGTH = 16;
    private static final String ALLOWED = "^[A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ]+$";

    private NicknameRules() {
    }

    public static String violationMessage(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() < MIN_LENGTH || trimmed.length() > MAX_LENGTH) {
            return "닉네임은 앞뒤 공백을 제외하고 2자 이상 16자 이하여야 합니다.";
        }
        if (!trimmed.matches(ALLOWED)) {
            return "닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.";
        }
        return null;
    }
}
