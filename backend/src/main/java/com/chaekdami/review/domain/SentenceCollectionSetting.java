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
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sentence_collection_settings",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_sentence_collection_settings_reading_record_id", columnNames = "reading_record_id"),
        indexes = {
                @Index(name = "idx_sentence_collection_settings_user_id", columnList = "user_id"),
                @Index(name = "idx_sentence_collection_settings_book_id", columnList = "book_id")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SentenceCollectionSetting extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reading_record_id", nullable = false)
    private Long readingRecordId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "book_id", nullable = false)
    private Long bookId;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic;

    public SentenceCollectionSetting(Long readingRecordId, Long userId, Long bookId, boolean isPublic) {
        this.readingRecordId = readingRecordId;
        this.userId = userId;
        this.bookId = bookId;
        this.isPublic = isPublic;
    }
}
