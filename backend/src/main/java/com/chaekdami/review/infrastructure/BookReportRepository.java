package com.chaekdami.review.infrastructure;

import com.chaekdami.review.domain.BookReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BookReportRepository extends JpaRepository<BookReport, Long> {

    Optional<BookReport> findByReadingRecordId(Long readingRecordId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from BookReport b where b.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from BookReport b where b.bookId = :bookId")
    int deleteAllByBookId(@Param("bookId") Long bookId);
}
