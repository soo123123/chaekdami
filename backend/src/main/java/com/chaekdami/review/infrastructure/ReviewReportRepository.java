package com.chaekdami.review.infrastructure;

import com.chaekdami.review.domain.ReportReason;
import com.chaekdami.review.domain.ReviewReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface ReviewReportRepository extends JpaRepository<ReviewReport, Long> {

    @Modifying(flushAutomatically = true)
    @Query(value = """
            insert into review_reports (review_id, user_id, reason, detail, created_at)
            values (:reviewId, :userId, :reason, :detail, :now)
            on conflict (review_id, user_id) do nothing
            """, nativeQuery = true)
    int insertIfAbsent(@Param("reviewId") Long reviewId, @Param("userId") Long userId,
                       @Param("reason") String reason, @Param("detail") String detail,
                       @Param("now") LocalDateTime now);

    @Query("""
            select r.review.id as reviewId, r.reason as reason, count(r) as count
            from ReviewReport r
            where r.review.id in :reviewIds
            group by r.review.id, r.reason
            """)
    List<ReasonCount> countReasons(@Param("reviewIds") Collection<Long> reviewIds);

    @Modifying(flushAutomatically = true)
    @Query("delete from ReviewReport r where r.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);

    @Modifying(flushAutomatically = true)
    @Query("delete from ReviewReport r where r.review.id in (select v.id from Review v where v.userId = :userId)")
    int deleteAllOnReviewsOf(@Param("userId") Long userId);

    @Modifying(flushAutomatically = true)
    @Query("delete from ReviewReport r where r.review.id in (select v.id from Review v where v.bookId = :bookId)")
    int deleteAllOnBook(@Param("bookId") Long bookId);

    interface ReasonCount {

        Long getReviewId();

        ReportReason getReason();

        long getCount();
    }
}
