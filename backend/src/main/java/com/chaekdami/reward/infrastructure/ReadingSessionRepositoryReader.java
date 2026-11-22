package com.chaekdami.reward.infrastructure;

import com.chaekdami.reading.infrastructure.ReadingSessionRepository;
import com.chaekdami.reward.application.port.ReadingSessionReader;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * BE1 의 ReadingSessionRepository 를 읽기만 해서 세션 정보를 가져온다. (BE1 코드는 수정하지 않는다)
 * BE1 이 세션 조회 메서드를 제공하면 그 메서드를 쓰는 구현으로 바꾼다.
 */
@Component
@RequiredArgsConstructor
public class ReadingSessionRepositoryReader implements ReadingSessionReader {

    private final ReadingSessionRepository readingSessionRepository;

    @Override
    public Optional<Session> findOwnSession(Long userId, Long readingSessionId) {
        return readingSessionRepository.findById(readingSessionId)
                .filter(session -> userId.equals(session.getUserId()))
                .map(session -> new Session(
                        session.getId(),
                        session.getDurationSeconds(),
                        session.getStartPage(),
                        session.getEndPage(),
                        session.getEndedAt()));
    }
}
