package com.chaekdami.reward.domain;

/**
 * 독서 세션 완료 시 지급하는 기본 경험치 규칙
 * - 1분당 1 EXP (30초 이상이면 1분으로 반올림)
 * - 5쪽당 1 EXP (나머지 3쪽 이상이면 1 EXP 추가)
 */
public final class ExperiencePolicy {

    private static final int SECONDS_PER_EXPERIENCE = 60;
    private static final int PAGES_PER_EXPERIENCE = 5;

    private ExperiencePolicy() {
    }

    /**
     * @param durationSeconds 검증된 독서 시간(초)
     * @param startPage       세션 시작 페이지
     * @param endPage         세션에서 읽은 마지막 페이지 (읽은 쪽 수 = endPage - startPage)
     */
    public static int readingExperience(int durationSeconds, int startPage, int endPage) {
        if (durationSeconds < 0) {
            throw new IllegalArgumentException("독서 시간은 0 이상이어야 합니다. (입력: " + durationSeconds + ")");
        }
        if (endPage < startPage) {
            throw new IllegalArgumentException("종료 페이지는 시작 페이지보다 작을 수 없습니다. (시작: " + startPage + ", 종료: " + endPage + ")");
        }
        int readPages = endPage - startPage;
        return roundDivide(durationSeconds, SECONDS_PER_EXPERIENCE) + roundDivide(readPages, PAGES_PER_EXPERIENCE);
    }

    /** 0 이상 정수의 Math.round(value / divisor) 와 같은 반올림 나눗셈 */
    private static int roundDivide(int value, int divisor) {
        return (value + divisor / 2) / divisor;
    }
}
