package com.chaekdami.review.infrastructure;

import com.chaekdami.review.domain.BookReportReport;
import com.chaekdami.review.domain.ReportReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface BookReportReportRepository extends JpaRepository<BookReportReport, Long> {

    @Modifying(flushAutomatically = true)
    @Query(value = """
            insert into book_report_reports (book_report_id, user_id, reason, detail, created_at)
            values (:targetId, :userId, :reason, :detail, :now)
            on conflict do nothing
            """, nativeQuery = true)
    int insertIfAbsent(@Param("targetId") Long targetId, @Param("userId") Long userId,
                       @Param("reason") String reason, @Param("detail") String detail,
                       @Param("now") LocalDateTime now);

    long countByUserIdAndCreatedAtGreaterThanEqual(Long userId, LocalDateTime from);

    @Query("""
            select r.bookReport.id as targetId, r.reason as reason, count(r) as count
            from BookReportReport r
            where r.bookReport.id in :targetIds
            group by r.bookReport.id, r.reason
            """)
    List<ReasonCount> countReasons(@Param("targetIds") Collection<Long> targetIds);

    @Modifying(flushAutomatically = true)
    @Query("delete from BookReportReport r where r.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);

    interface ReasonCount {

        Long getTargetId();

        ReportReason getReason();

        long getCount();
    }
}
