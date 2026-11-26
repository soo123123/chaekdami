package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.application.port.WeeklyReadingTimeReader;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * BE1 의 ReadingSession 을 읽기만 해서 기간별 독서 시간을 집계한다. (BE1 코드는 수정하지 않는다)
 */
@Component
@RequiredArgsConstructor
public class ReadingSessionTimeReader implements WeeklyReadingTimeReader {

    private final ReadingSessionTimeQueryRepository readingSessionTimeQueryRepository;

    @Override
    public List<UserSeconds> findTop(LocalDateTime start, LocalDateTime end, LocalDateTime now, int limit) {
        return readingSessionTimeQueryRepository.findTopSeconds(start, end, now, PageRequest.of(0, limit)).stream()
                .map(row -> new UserSeconds(row.getUserId(), row.getSeconds()))
                .toList();
    }

    @Override
    public long sumOf(Long userId, LocalDateTime start, LocalDateTime end) {
        return readingSessionTimeQueryRepository.sumSeconds(userId, start, end);
    }

    @Override
    public long countUsersGreaterThan(LocalDateTime start, LocalDateTime end, LocalDateTime now, long seconds) {
        return readingSessionTimeQueryRepository.countUsersWithSecondsGreaterThan(start, end, now, seconds);
    }
}
