package com.chaekdami.reading.infrastructure;

import com.chaekdami.reading.domain.ReadingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReadingSessionRepository extends JpaRepository<ReadingSession, Long> {

    // 한 회차의 세션 목록 (최근 것 먼저)
    List<ReadingSession> findAllByReadingRecordIdOrderByStartedAtDesc(Long readingRecordId);

    List<ReadingSession> findAllByUserId(Long userId);

    // 서재에서 책을 지울 때 그 책의 모든 세션 삭제
    void deleteAllByReadingRecordBookId(Long bookId);

    @Query("""
            select s from ReadingSession s
            where s.userId = :userId
              and s.startedAt >= :start
              and s.startedAt < :end
            """)
    List<ReadingSession> findByUserIdAndStartedAtBetween(
            @Param("userId") Long userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
