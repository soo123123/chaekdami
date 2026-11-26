package com.chaekdami.review.infrastructure;

import com.chaekdami.review.domain.SentenceReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface SentenceReportRepository extends JpaRepository<SentenceReport, Long> {

    @Modifying(flushAutomatically = true)
    @Query(value = """
            insert into sentence_reports (sentence_id, user_id, reason, detail, created_at)
            values (:targetId, :userId, :reason, :detail, :now)
            on conflict do nothing
            """, nativeQuery = true)
    int insertIfAbsent(@Param("targetId") Long targetId, @Param("userId") Long userId,
                       @Param("reason") String reason, @Param("detail") String detail,
                       @Param("now") LocalDateTime now);

    long countByUserIdAndCreatedAtGreaterThanEqual(Long userId, LocalDateTime from);

    @Query("""
            select r.sentence.id as targetId, r.reason as reason, count(r) as count
            from SentenceReport r
            where r.sentence.id in :targetIds
            group by r.sentence.id, r.reason
            """)
    List<BookReportReportRepository.ReasonCount> countReasons(@Param("targetIds") Collection<Long> targetIds);

    @Modifying(flushAutomatically = true)
    @Query("delete from SentenceReport r where r.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
