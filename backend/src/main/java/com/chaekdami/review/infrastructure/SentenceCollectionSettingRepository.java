package com.chaekdami.review.infrastructure;

import com.chaekdami.review.domain.SentenceCollectionSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface SentenceCollectionSettingRepository extends JpaRepository<SentenceCollectionSetting, Long> {

    Optional<SentenceCollectionSetting> findByReadingRecordId(Long readingRecordId);

    @Modifying(clearAutomatically = true)
    @Query(value = """
            insert into sentence_collection_settings
                (reading_record_id, user_id, book_id, is_public, created_at, updated_at)
            values (:readingRecordId, :userId, :bookId, :isPublic, :now, :now)
            on conflict (reading_record_id)
            do update set is_public = excluded.is_public, updated_at = excluded.updated_at
            """, nativeQuery = true)
    int upsertVisibility(@Param("readingRecordId") Long readingRecordId, @Param("userId") Long userId,
                         @Param("bookId") Long bookId, @Param("isPublic") boolean isPublic,
                         @Param("now") LocalDateTime now);

    @Modifying
    @Query("delete from SentenceCollectionSetting s where s.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("delete from SentenceCollectionSetting s where s.bookId = :bookId")
    int deleteAllByBookId(@Param("bookId") Long bookId);
}
