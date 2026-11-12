package com.chaekdami.review.domain;

import com.chaekdami.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "sentences", indexes = {
        @Index(name = "idx_sentences_reading_record_id_read_date", columnList = "reading_record_id, read_date"),
        @Index(name = "idx_sentences_user_id", columnList = "user_id"),
        @Index(name = "idx_sentences_book_id", columnList = "book_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Sentence extends BaseTimeEntity {

    public static final int MAX_CONTENT_LENGTH = 500;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "reading_record_id", nullable = false)
    private Long readingRecordId;

    @Column(name = "book_id", nullable = false)
    private Long bookId;

    @Column(name = "read_date", nullable = false, updatable = false)
    private LocalDate readDate;

    @Column(name = "page_number")
    private Integer pageNumber;

    @Column(nullable = false, length = MAX_CONTENT_LENGTH)
    private String content;

    @Builder
    public Sentence(Long userId, Long readingRecordId, Long bookId, LocalDate readDate,
                    Integer pageNumber, String content) {
        this.userId = userId;
        this.readingRecordId = readingRecordId;
        this.bookId = bookId;
        this.readDate = readDate;
        this.pageNumber = pageNumber;
        this.content = content;
    }

    public void changeContent(String content) {
        this.content = content;
    }

    public void changePageNumber(Integer pageNumber) {
        this.pageNumber = pageNumber;
    }

    public boolean ownedBy(Long userId) {
        return this.userId.equals(userId);
    }
}
