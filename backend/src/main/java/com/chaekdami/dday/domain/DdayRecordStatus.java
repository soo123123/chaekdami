package com.chaekdami.dday.domain;

public enum DdayRecordStatus {
    READ,
    PROTECTED;

    public String code() {
        return name().toLowerCase();
    }

    public static DdayRecordStatus fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("달력 상태를 입력해야 합니다.");
        }
        return switch (code.trim().toLowerCase()) {
            case "read" -> READ;
            case "protected" -> PROTECTED;
            default -> throw new IllegalArgumentException("달력 상태는 read 또는 protected 여야 합니다.");
        };
    }
}
