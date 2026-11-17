package com.chaekdami.reading.application;

/**
 * 오늘 독서 기록 요약.
 *
 * @param readingMinutes 오늘 세션 시간을 합친 뒤 30초 단위로 반올림한 분
 * @param pagesRead      오늘 세션의 (종료 쪽 - 시작 쪽) 합
 * @param memoCount      오늘 저장한 문장 수
 */
public record TodayReadingSummary(int readingMinutes, int pagesRead, int memoCount) {
}
