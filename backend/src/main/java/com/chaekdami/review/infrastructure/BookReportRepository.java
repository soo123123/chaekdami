package com.chaekdami.review.infrastructure;

import com.chaekdami.review.domain.BookReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface BookReportRepository extends JpaRepository<BookReport, Long> {

    Optional<BookReport> findByReadingRecordId(Long readingRecordId);

    @Query("""
            select b from BookReport b
            where (b.reportCount > 0 or b.isBlinded = true)
              and (:blinded is null or b.isBlinded = :blinded)
            """)
    Page<BookReport> findReported(@Param("blinded") Boolean blinded, Pageable pageable);

    /** 신고 수 증가와 임계값 도달 시 블라인드를 한 문장으로 처리한다. SET의 우변은 갱신 전 값을 본다. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            update book_reports
            set report_count = report_count + 1,
                is_blinded = is_blinded or report_count + 1 >= :threshold,
                blinded_at = case when not is_blinded and report_count + 1 >= :threshold
                                  then :now else blinded_at end
            where id = :id
            """, nativeQuery = true)
    int addReport(@Param("id") Long id, @Param("threshold") int threshold, @Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "update book_reports set is_blinded = false, blinded_at = null, report_count = 0 where id = :id",
            nativeQuery = true)
    int unblind(@Param("id") Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "update book_reports set is_blinded = true, blinded_at = :now where id = :id and not is_blinded",
            nativeQuery = true)
    int blind(@Param("id") Long id, @Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from BookReport b where b.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from BookReport b where b.bookId = :bookId")
    int deleteAllByBookId(@Param("bookId") Long bookId);
}
