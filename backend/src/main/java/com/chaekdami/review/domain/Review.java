package com.chaekdami.review.domain;

import com.chaekdami.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 책당 1개인 별점과 한줄평. 좋아요 수, 신고 수, 블라인드 상태는 동시 요청에서 값을 잃지 않도록
 * 리포지토리의 원자적 UPDATE로만 바꾸고, 엔티티 변경 감지로는 쓰지 않는다.
 */
@Entity
@Table(name = "reviews",
        uniqueConstraints = @UniqueConstraint(name = "uk_reviews_book_id", columnNames = "book_id"),
        indexes = {
                @Index(name = "idx_reviews_user_id", columnList = "user_id"),
                @Index(name = "idx_reviews_isbn_created_at", columnList = "isbn, created_at"),
                @Index(name = "idx_reviews_isbn_like_count", columnList = "isbn, like_count")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review extends BaseTimeEntity {

    public static final int MIN_RATING = 1;
    public static final int MAX_RATING = 5;
    public static final int MAX_ONE_LINE_LENGTH = 100;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "book_id", nullable = false)
    private Long bookId;

    @Column(length = 20)
    private String isbn;

    @Column(nullable = false)
    private short rating;

    @Column(name = "one_line", length = MAX_ONE_LINE_LENGTH)
    private String oneLine;

    @Column(name = "is_spoiler", nullable = false)
    private boolean isSpoiler;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic;

    @Column(name = "like_count", nullable = false, updatable = false)
    private int likeCount;

    @Column(name = "report_count", nullable = false, updatable = false)
    private int reportCount;

    @Column(name = "is_blinded", nullable = false, updatable = false)
    private boolean isBlinded;

    @Column(name = "blinded_at", updatable = false)
    private LocalDateTime blindedAt;

    @Builder
    public Review(Long userId, Long bookId, String isbn, int rating, String oneLine,
                  boolean isSpoiler, Boolean isPublic) {
        this.userId = userId;
        this.bookId = bookId;
        this.isbn = isbn;
        this.rating = (short) rating;
        this.oneLine = oneLine;
        this.isSpoiler = isSpoiler;
        this.isPublic = isPublic == null || isPublic;
    }

    public void changeRating(int rating) {
        this.rating = (short) rating;
    }

    public void changeOneLine(String oneLine) {
        this.oneLine = oneLine;
    }

    public void changeSpoiler(boolean isSpoiler) {
        this.isSpoiler = isSpoiler;
    }

    public void changeVisibility(boolean isPublic) {
        this.isPublic = isPublic;
    }

    public void syncIsbn(String isbn) {
        this.isbn = isbn;
    }

    public boolean ownedBy(Long userId) {
        return this.userId.equals(userId);
    }

    public boolean publiclyVisible() {
        return isPublic && !isBlinded && oneLine != null && isbn != null;
    }
}
