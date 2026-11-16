package com.chaekdami.reading.application;

import com.chaekdami.reading.domain.ReadingSession;
import com.chaekdami.reading.domain.ReadingStatus;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.reading.infrastructure.ReadingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReadingStatsService {

    private static final String[] WEEKDAY_LABELS = {"월", "화", "수", "목", "금", "토", "일"};
    private static final String[] DAILY_LABELS = {"06시", "09시", "12시", "15시", "18시", "21시"};
    private static final int[] DAILY_START_HOURS = {5, 8, 11, 14, 17, 20};

    private final ReadingSessionRepository readingSessionRepository;
    private final ReadingRecordRepository readingRecordRepository;

    @Transactional(readOnly = true)
    public ReadingStatsResult stats(Long userId) {
        List<ReadingSession> sessions = readingSessionRepository.findAllByUserId(userId);
        LocalDate today = LocalDate.now();

        int totalSeconds = 0;
        int totalPages = 0;
        for (ReadingSession session : sessions) {
            totalSeconds += secondsOf(session);
            totalPages += pagesOf(session);
        }
        int totalMinutes = totalSeconds / 60;
        int readingDays = (int) sessions.stream()
                .map(ReadingSession::getStartedAt)
                .filter(startedAt -> startedAt != null)
                .map(startedAt -> startedAt.toLocalDate())
                .distinct()
                .count();
        int completedBooks = (int) readingRecordRepository.countDistinctBooksByUserIdAndStatus(
                userId, ReadingStatus.COMPLETED);

        return new ReadingStatsResult(
                totalMinutes,
                readingDays == 0 ? 0 : totalMinutes / readingDays,
                completedBooks,
                totalPages,
                readingDays,
                0,
                0,
                week(sessions, today),
                month(sessions, today),
                day(sessions, today)
        );
    }

    private List<ReadingStatsResult.Bucket> week(List<ReadingSession> sessions, LocalDate today) {
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        List<ReadingStatsResult.Bucket> buckets = new ArrayList<>();
        for (int i = 0; i < WEEKDAY_LABELS.length; i++) {
            buckets.add(new ReadingStatsResult.Bucket(
                    WEEKDAY_LABELS[i], minutesOn(sessions, monday.plusDays(i))));
        }
        return buckets;
    }

    private List<ReadingStatsResult.Bucket> month(List<ReadingSession> sessions, LocalDate today) {
        LocalDate first = today.withDayOfMonth(1);
        int lastDay = today.lengthOfMonth();
        List<ReadingStatsResult.Bucket> buckets = new ArrayList<>();
        for (int week = 0; week < 4; week++) {
            int startDay = week * 7 + 1;
            int endDay = week == 3 ? lastDay : Math.min(lastDay, startDay + 6);
            int minutes = 0;
            if (startDay <= lastDay) {
                LocalDate start = first.withDayOfMonth(startDay);
                LocalDate end = first.withDayOfMonth(endDay);
                for (ReadingSession session : sessions) {
                    if (session.getStartedAt() == null) {
                        continue;
                    }
                    LocalDate date = session.getStartedAt().toLocalDate();
                    if (!date.isBefore(start) && !date.isAfter(end)) {
                        minutes += secondsOf(session) / 60;
                    }
                }
            }
            buckets.add(new ReadingStatsResult.Bucket((week + 1) + "주", minutes));
        }
        return buckets;
    }

    private List<ReadingStatsResult.Bucket> day(List<ReadingSession> sessions, LocalDate today) {
        int[] seconds = new int[DAILY_LABELS.length];
        for (ReadingSession session : sessions) {
            if (session.getStartedAt() == null || !session.getStartedAt().toLocalDate().equals(today)) {
                continue;
            }
            int hour = session.getStartedAt().getHour();
            int index = DAILY_LABELS.length - 1;
            for (int i = DAILY_START_HOURS.length - 1; i >= 0; i--) {
                if (hour >= DAILY_START_HOURS[i]) {
                    index = i;
                    break;
                }
            }
            seconds[index] += secondsOf(session);
        }
        List<ReadingStatsResult.Bucket> buckets = new ArrayList<>();
        for (int i = 0; i < DAILY_LABELS.length; i++) {
            buckets.add(new ReadingStatsResult.Bucket(DAILY_LABELS[i], seconds[i] / 60));
        }
        return buckets;
    }

    private int minutesOn(List<ReadingSession> sessions, LocalDate date) {
        int seconds = 0;
        for (ReadingSession session : sessions) {
            if (session.getStartedAt() != null && session.getStartedAt().toLocalDate().equals(date)) {
                seconds += secondsOf(session);
            }
        }
        return seconds / 60;
    }

    private static int secondsOf(ReadingSession session) {
        return session.getDurationSeconds() == null ? 0 : session.getDurationSeconds();
    }

    private static int pagesOf(ReadingSession session) {
        int start = session.getStartPage() == null ? 0 : session.getStartPage();
        int end = session.getEndPage() == null ? start : session.getEndPage();
        return Math.max(0, end - start);
    }
}
