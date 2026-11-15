package com.chaekdami.reading.domain;

// 독서 상태 (서재 필터: 읽기 전 / 읽는 중 / 완독)
public enum ReadingStatus {
    NOT_STARTED,   // 읽기 전
    IN_PROGRESS,   // 읽는 중
    COMPLETED      // 완독
}
