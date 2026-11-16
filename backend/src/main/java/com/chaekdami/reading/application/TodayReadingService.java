package com.chaekdami.reading.application;

import com.chaekdami.reading.domain.ReadingSession;
import com.chaekdami.reading.infrastructure.ReadingSessionRepository;
import com.chaekdami.review.infrastructure.SentenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 홈의 오늘 독서 기록. 세션과 문장을 사용자 전체에서 오늘 날짜로 모은다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TodayReadingService {

    private final ReadingSessionRepository readingSessionRepository;
    private final SentenceRepository sentenceRepository;

    public TodayReadingSummary today(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDateTime start = today.atStartOfDay();
        List<ReadingSession> sessions = readingSessionRepository
                .findByUserIdAndStartedAtBetween(userId, start, start.plusDays(1));

        int totalSeconds = 0;
        int pagesRead = 0;
        for (ReadingSession session : sessions) {
            totalSeconds += session.getDurationSeconds();
            pagesRead += Math.max(0, session.getEndPage() - session.getStartPage());
        }
        int readingMinutes = (totalSeconds + 30) / 60;
        int memoCount = (int) sentenceRepository.countByUserIdAndReadDate(userId, today);
        return new TodayReadingSummary(readingMinutes, pagesRead, memoCount);
    }
}
