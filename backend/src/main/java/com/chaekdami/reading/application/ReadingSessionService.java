package com.chaekdami.reading.application;

import com.chaekdami.reading.domain.Book;
import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.domain.ReadingSession;
import com.chaekdami.reading.infrastructure.BookRepository;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.reading.infrastructure.ReadingSessionRepository;
import com.chaekdami.reading.presentation.dto.request.CreateReadingSessionRequest;
import com.chaekdami.reading.presentation.dto.response.ReadingSessionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReadingSessionService {

    private final BookRepository bookRepository;
    private final ReadingRecordRepository readingRecordRepository;
    private final ReadingSessionRepository readingSessionRepository;

    // 독서 종료 후 저장: bookId로 지금 읽는 회차를 찾아 세션을 붙이고, 현재 페이지를 갱신
    @Transactional
    public ReadingSessionResponse create(Long userId, CreateReadingSessionRequest request) {
        if (request.bookId() == null || request.readingTime() == null
                || request.startPage() == null || request.endPage() == null) {
            throw new IllegalArgumentException("bookId, readingTime, startPage, endPage는 필수입니다.");
        }
        Book book = bookRepository.findByIdAndUserId(request.bookId(), userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "책을 찾을 수 없습니다: " + request.bookId()));

        ReadingRecord record = findOrStartCurrentRecord(book);

        LocalDateTime now = LocalDateTime.now();
        ReadingSession session = ReadingSession.of(record, request.readingTime(),
                request.startPage(), request.endPage(), now);
        record.applySession(request.endPage(), now);

        // sentence, photos는 아직 저장하지 않음 (BE 3 문장 모음 / 사진 업로드 방식 확정 후 연결)
        return ReadingSessionResponse.from(readingSessionRepository.save(session));
    }

    // 한 회차의 세션 목록 (최근 것 먼저)
    public List<ReadingSessionResponse> getSessions(Long userId, Long recordId) {
        readingRecordRepository.findByIdAndUserId(recordId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "독서 기록을 찾을 수 없습니다: " + recordId));
        return readingSessionRepository.findAllByReadingRecordIdOrderByStartedAtDesc(recordId).stream()
                .map(ReadingSessionResponse::from)
                .toList();
    }

    // 지금 읽는 회차: 최근 회차가 진행 중이면 그것, 기록이 하나도 없으면 1회차 생성, 최근 회차가 완독이면 409
    private ReadingRecord findOrStartCurrentRecord(Book book) {
        ReadingRecord latest = readingRecordRepository.findFirstByBookIdOrderByRoundDesc(book.getId()).orElse(null);
        if (latest == null) {
            return readingRecordRepository.save(ReadingRecord.start(book, 1));
        }
        if (latest.isCompleted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "완독한 책입니다. 다시 읽으려면 새 회차를 먼저 시작해주세요.");
        }
        return latest;
    }
}
