package com.chaekdami.reading.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

// 독서 기록: 서재의 책 한 권을 "한 번" 읽는 기록 (다회독이면 회차마다 1건)
@Entity
@Table(
        name = "reading_records",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_reading_records_book_id_round",
                columnNames = {"book_id", "round"}   // 같은 책에 같은 회차가 두 번 생기지 않게
        ),
        indexes = @Index(name = "idx_reading_records_user_id", columnList = "user_id")
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReadingRecord {

    private static final int MAX_MEMO_LENGTH = 200;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId; // 읽는 사용자 (항상 book.userId와 같음, 조회 편의용)

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id")
    private Book book; // 어떤 서재 책의 기록인지

    @Column(nullable = false)
    private Integer round; // 회차 (1회독, 2회독 ...)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReadingStatus status;

    @Column(nullable = false)
    private Integer currentPage; // 현재 읽은 페이지

    private LocalDate goalDate; // 목표 완독 날짜 (선택)

    private Integer goalPage; // 하루 목표 페이지 (선택)

    @Column(length = MAX_MEMO_LENGTH)
    private String memo; // 한마디 메모 (선택)

    @Column(nullable = false)
    private boolean isPublic; // 공개 여부 (기본 비공개)

    private LocalDateTime startedAt;   // 처음 페이지를 넘긴 시각
    private LocalDateTime completedAt; // 완독 시각

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // 새 회차 시작 (읽기 전 상태, 0쪽)
    public static ReadingRecord start(Book book, int round) {
        ReadingRecord record = new ReadingRecord();
        record.userId = book.getUserId();
        record.book = book;
        record.round = round;
        record.status = ReadingStatus.NOT_STARTED;
        record.currentPage = 0;
        record.isPublic = false;
        return record;
    }

    // 현재 페이지 갱신: 0쪽 초과면 "읽는 중", 마지막 쪽이면 자동 완독
    public void updatePage(int page, LocalDateTime now) {
        if (isCompleted()) {
            throw new IllegalArgumentException("완독한 기록은 페이지를 수정할 수 없습니다. 새 회차를 시작해주세요.");
        }
        if (page < 0 || page > getTotalPages()) {
            throw new IllegalArgumentException("현재 페이지는 0 이상 " + getTotalPages() + " 이하여야 합니다.");
        }
        this.currentPage = page;
        if (page > 0 && status == ReadingStatus.NOT_STARTED) {
            this.status = ReadingStatus.IN_PROGRESS;
            this.startedAt = now;
        }
        if (page == getTotalPages()) {
            complete(now);
        }
    }

    // 완독 처리 (이미 완독이면 아무것도 바꾸지 않음)
    public void complete(LocalDateTime now) {
        if (isCompleted()) {
            return;
        }
        this.currentPage = getTotalPages();
        this.status = ReadingStatus.COMPLETED;
        if (this.startedAt == null) {
            this.startedAt = now;
        }
        this.completedAt = now;
    }

    public void changeGoal(LocalDate goalDate, Integer goalPage) {
        if (goalPage != null && goalPage <= 0) {
            throw new IllegalArgumentException("하루 목표 페이지는 1 이상이어야 합니다.");
        }
        this.goalDate = goalDate;
        this.goalPage = goalPage;
    }

    public void changeMemo(String memo) {
        if (memo != null && memo.length() > MAX_MEMO_LENGTH) {
            throw new IllegalArgumentException("메모는 " + MAX_MEMO_LENGTH + "자 이하여야 합니다.");
        }
        this.memo = memo;
    }

    public void changePublic(boolean isPublic) {
        this.isPublic = isPublic;
    }

    public boolean isCompleted() {
        return status == ReadingStatus.COMPLETED;
    }

    public int getTotalPages() {
        return book.getTotalPages();
    }

    // 독서율 (%): 저장하지 않고 계산
    public int getProgressRate() {
        return currentPage * 100 / getTotalPages();
    }
}
