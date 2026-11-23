package com.chaekdami.review.infrastructure;

import com.chaekdami.reading.application.port.SessionSentenceRecorder;
import com.chaekdami.review.application.SentenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 독서 세션 저장(BE1)의 문장을 {@link SentenceService#recordFromSession}으로 저장한다.
 * 빈 문장은 저장하지 않고, 규칙 위반(500자 초과 등)은 예외를 그대로 던진다.
 */
@Component
@RequiredArgsConstructor
public class SentenceServiceSessionSentenceRecorder implements SessionSentenceRecorder {

    private final SentenceService sentenceService;

    @Override
    public void record(Long userId, Long readingRecordId, String sentence, Integer pageNumber) {
        sentenceService.recordFromSession(userId, readingRecordId, sentence, pageNumber);
    }
}
