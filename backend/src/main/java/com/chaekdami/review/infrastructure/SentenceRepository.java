package com.chaekdami.review.infrastructure;

import com.chaekdami.review.domain.Sentence;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface SentenceRepository extends JpaRepository<Sentence, Long> {

    List<Sentence> findAllByReadingRecordIdOrderByCreatedAtDescIdDesc(Long readingRecordId);

    long countByUserIdAndReadDate(Long userId, LocalDate readDate);

    List<Sentence> findAllByReadingRecordId(Long readingRecordId);

    @Query("select s from Sentence s where s.readingRecordId = :readingRecordId and s.isBlinded = false")
    List<Sentence> findVisibleByReadingRecordId(@Param("readingRecordId") Long readingRecordId);

    @Query("""
            select s from Sentence s
            where (s.reportCount > 0 or s.isBlinded = true)
              and (:blinded is null or s.isBlinded = :blinded)
            """)
    Page<Sentence> findReported(@Param("blinded") Boolean blinded, Pageable pageable);

    /** 신고 수 증가와 임계값 도달 시 블라인드를 한 문장으로 처리한다. SET의 우변은 갱신 전 값을 본다. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            update sentences
            set report_count = report_count + 1,
                is_blinded = is_blinded or report_count + 1 >= :threshold,
                blinded_at = case when not is_blinded and report_count + 1 >= :threshold
                                  then :now else blinded_at end
            where id = :id
            """, nativeQuery = true)
    int addReport(@Param("id") Long id, @Param("threshold") int threshold, @Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "update sentences set is_blinded = false, blinded_at = null, report_count = 0 where id = :id",
            nativeQuery = true)
    int unblind(@Param("id") Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "update sentences set is_blinded = true, blinded_at = :now where id = :id and not is_blinded",
            nativeQuery = true)
    int blind(@Param("id") Long id, @Param("now") LocalDateTime now);

    List<Sentence> findAllByReadingRecordIdIn(Collection<Long> readingRecordIds);

    @Query(value = """
            select s.readingRecordId as readingRecordId, count(s) as sentenceCount, max(s.readDate) as lastReadDate
            from Sentence s
            where s.userId = :userId
            group by s.readingRecordId
            order by max(s.readDate) desc, max(s.id) desc
            """,
            countQuery = "select count(distinct s.readingRecordId) from Sentence s where s.userId = :userId")
    Page<CollectionStats> findCollectionStats(@Param("userId") Long userId, Pageable pageable);

    @Query(value = """
            select s.readingRecordId as readingRecordId, count(s) as sentenceCount, max(s.readDate) as lastReadDate
            from Sentence s
            where s.userId = :userId and s.bookId = :bookId
            group by s.readingRecordId
            order by max(s.readDate) desc, max(s.id) desc
            """,
            countQuery = """
                    select count(distinct s.readingRecordId) from Sentence s
                    where s.userId = :userId and s.bookId = :bookId
                    """)
    Page<CollectionStats> findCollectionStatsByBook(@Param("userId") Long userId, @Param("bookId") Long bookId,
                                                    Pageable pageable);

    @Modifying
    @Query("delete from Sentence s where s.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("delete from Sentence s where s.bookId = :bookId")
    int deleteAllByBookId(@Param("bookId") Long bookId);

    interface CollectionStats {

        Long getReadingRecordId();

        long getSentenceCount();

        LocalDate getLastReadDate();
    }
}
