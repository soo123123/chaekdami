package com.chaekdami.reading.infrastructure;

import com.chaekdami.reading.domain.ReadingSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReadingSessionRepository extends JpaRepository<ReadingSession, Long> {

    // 한 회차의 세션 목록 (최근 것 먼저)
    List<ReadingSession> findAllByReadingRecordIdOrderByStartedAtDesc(Long readingRecordId);

    // 서재에서 책을 지울 때 그 책의 모든 세션 삭제
    void deleteAllByReadingRecordBookId(Long bookId);
}
