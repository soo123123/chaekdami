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

@Entity
@Table(name = "book_reports",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_book_reports_reading_record_id", columnNames = "reading_record_id"),
        indexes = {
                @Index(name = "idx_book_reports_user_id", columnList = "user_id"),
                @Index(name = "idx_book_reports_book_id", columnList = "book_id")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BookReport extends BaseTimeEntity {

    public static final int MAX_CONTENT_LENGTH = 2000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "reading_record_id", nullable = false)
    private Long readingRecordId;

    @Column(name = "book_id", nullable = false)
    private Long bookId;

    @Column(nullable = false, length = MAX_CONTENT_LENGTH)
    private String content;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic;

    /**
     * 본문이 바뀔 때마다 1씩 늘어난다. AI 피드백이 어느 본문 기준인지 판단할 때 쓴다.
     */
    @Column(nullable = false)
    private int revision;

    @Builder
    public BookReport(Long userId, Long readingRecordId, Long bookId, String content, boolean isPublic) {
        this.userId = userId;
        this.readingRecordId = readingRecordId;
        this.bookId = bookId;
        this.content = content;
        this.isPublic = isPublic;
        this.revision = 1;
    }

    /**
     * @return 본문이 바뀌었으면 true
     */
    public boolean changeContent(String content) {
        if (this.content.equals(content)) {
            return false;
        }
        this.content = content;
        this.revision++;
        return true;
    }

    public void changeVisibility(boolean isPublic) {
        this.isPublic = isPublic;
    }

    public boolean ownedBy(Long userId) {
        return this.userId.equals(userId);
    }
}
