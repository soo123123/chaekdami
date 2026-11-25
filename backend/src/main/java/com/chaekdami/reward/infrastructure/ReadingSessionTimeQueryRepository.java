package com.chaekdami.reward.infrastructure;

import com.chaekdami.reading.domain.ReadingSession;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 주간 독서 시간 랭킹용 읽기 전용 집계 쿼리. reading(BE1)의 ReadingSessionRepository 는 고치지 않고 reward 쪽에 둔다.
 * 기간은 세션 종료 시각(ended_at) 기준 [start, end) 이다.
 */
public interface ReadingSessionTimeQueryRepository extends Repository<ReadingSession, Long> {

    @Query("""
            select s.userId as userId, sum(s.durationSeconds) as seconds
            from ReadingSession s
            where s.endedAt >= :start and s.endedAt < :end
            group by s.userId
            order by sum(s.durationSeconds) desc, s.userId asc
            """)
    List<UserSeconds> findTopSeconds(@Param("start") LocalDateTime start,
                                     @Param("end") LocalDateTime end,
                                     Pageable pageable);

    @Query("""
            select coalesce(sum(s.durationSeconds), 0)
            from ReadingSession s
            where s.userId = :userId and s.endedAt >= :start and s.endedAt < :end
            """)
    long sumSeconds(@Param("userId") Long userId,
                    @Param("start") LocalDateTime start,
                    @Param("end") LocalDateTime end);

    @Query("""
            select count(distinct s.userId)
            from ReadingSession s
            where s.userId in (
                select r.userId
                from ReadingSession r
                where r.endedAt >= :start and r.endedAt < :end
                group by r.userId
                having sum(r.durationSeconds) > :seconds
            )
            """)
    long countUsersWithSecondsGreaterThan(@Param("start") LocalDateTime start,
                                          @Param("end") LocalDateTime end,
                                          @Param("seconds") long seconds);

    interface UserSeconds {
        Long getUserId();

        Long getSeconds();
    }
}
