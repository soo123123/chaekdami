package com.chaekdami.reminder.infrastructure;

import com.chaekdami.reading.domain.ReadingSession;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 알림용 읽기 전용 세션 조회. reading(BE1)의 ReadingSessionRepository 는 고치지 않고 reminder 쪽에 둔다.
 */
public interface ReminderSessionQueryRepository extends Repository<ReadingSession, Long> {

    @Query("""
            select s.endedAt as endedAt, s.durationSeconds as durationSeconds
            from ReadingSession s
            where s.userId = :userId and s.endedAt >= :start and s.endedAt < :end
            """)
    List<EndedRow> findEnded(@Param("userId") Long userId,
                             @Param("start") LocalDateTime start,
                             @Param("end") LocalDateTime end);

    interface EndedRow {
        LocalDateTime getEndedAt();

        Integer getDurationSeconds();
    }
}
