package com.chaekdami.reminder.infrastructure;

import com.chaekdami.reminder.application.port.ReminderReadingReader;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * BE1 의 ReadingSession 을 읽기만 한다. (BE1 코드는 수정하지 않는다)
 */
@Component
@RequiredArgsConstructor
public class ReadingSessionReminderReader implements ReminderReadingReader {

    private final ReminderSessionQueryRepository reminderSessionQueryRepository;

    @Override
    public List<EndedSession> findEndedBetween(Long userId, LocalDateTime start, LocalDateTime end) {
        return reminderSessionQueryRepository.findEnded(userId, start, end).stream()
                .map(row -> new EndedSession(row.getEndedAt(),
                        row.getDurationSeconds() == null ? 0 : row.getDurationSeconds()))
                .toList();
    }
}
