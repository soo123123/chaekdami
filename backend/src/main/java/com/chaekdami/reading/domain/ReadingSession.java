package com.chaekdami.reading.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

// 독서 세션: 타이머로 한 번 읽은 기록 (몇 초 동안, 몇 쪽부터 몇 쪽까지)
@Entity
@Table(
        name = "reading_sessions",
        indexes = {
                @Index(name = "idx_reading_sessions_reading_record_id", columnList = "reading_record_id"),
                @Index(name = "idx_reading_sessions_user_id_started_at", columnList = "user_id, started_at")   // 오늘/이번 주 통계용
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReadingSession {

    public static final int MAX_SECONDS = 2 * 60 * 60;   // 한 번 최대 2시간

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId; // 읽은 사용자 (통계·보상 조회 편의용)

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reading_record_id")
    private ReadingRecord readingRecord; // 어느 회차의 세션인지

    @Column(nullable = false)
    private LocalDateTime startedAt; // 시작 시각 (서버 기준: 종료 시각 - 독서 시간)

    @Column(nullable = false)
    private LocalDateTime endedAt;   // 종료 시각 (서버가 저장 요청을 받은 시각)

    @Column(nullable = false)
    private Integer durationSeconds; // 실제 읽은 시간(초), 최대 2시간

    @Column(nullable = false)
    private Integer startPage;

    @Column(nullable = false)
    private Integer endPage;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static ReadingSession of(ReadingRecord record, int durationSeconds,
                                    int startPage, int endPage, LocalDateTime endedAt) {
        if (durationSeconds <= 0) {
            throw new IllegalArgumentException("독서 시간은 1초 이상이어야 합니다.");
        }
        if (durationSeconds > MAX_SECONDS) {
            throw new IllegalArgumentException("한 번의 독서 시간은 최대 2시간입니다.");
        }
        if (startPage < 0 || endPage < startPage) {
            throw new IllegalArgumentException("시작 페이지는 0 이상, 종료 페이지는 시작 페이지 이상이어야 합니다.");
        }
        if (endPage > record.getTotalPages()) {
            throw new IllegalArgumentException("종료 페이지는 전체 쪽수(" + record.getTotalPages() + ")를 넘을 수 없습니다.");
        }
        ReadingSession session = new ReadingSession();
        session.userId = record.getUserId();
        session.readingRecord = record;
        session.durationSeconds = durationSeconds;
        session.startPage = startPage;
        session.endPage = endPage;
        session.endedAt = endedAt;
        session.startedAt = endedAt.minusSeconds(durationSeconds);
        return session;
    }
}
