package com.chaekdami.reading.application;

import com.chaekdami.reading.domain.Book;
import com.chaekdami.reading.domain.Certification;
import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.domain.ReadingSession;
import com.chaekdami.reading.infrastructure.BookRepository;
import com.chaekdami.reading.infrastructure.CertificationRepository;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.reading.infrastructure.ReadingSessionRepository;
import com.chaekdami.reading.presentation.dto.request.CreateReadingSessionRequest;
import com.chaekdami.reading.presentation.dto.response.ReadingSessionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReadingSessionService {

    private final BookRepository bookRepository;
    private final ReadingRecordRepository readingRecordRepository;
    private final ReadingSessionRepository readingSessionRepository;
    private final CertificationRepository certificationRepository;

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
        ReadingSession saved = readingSessionRepository.save(session);
        linkCertification(userId, request.photoVerificationId(), saved);
        // 보상(독서 경험치, 퀘스트, D-day)은 저장 때 주지 않는다. 독서 완료 화면이
        // POST /api/rewards/reading-sessions/{id} 로 요청한다. (BE1 사진 인증 요구사항 7절)
        // 문장은 클라이언트가 별도 API로 저장한다. 사진은 아직 저장하지 않는다.
        // 사진 인증 추가 보상은 이 세션에 연결된 인증으로 판단한다 (linkCertification).
        return ReadingSessionResponse.from(saved);
    }

    // 통과한 독서 인증을 이 세션에 연결 (보상 판단용)
    // - 내 인증 + PASSED + 아직 안 쓰였을 때만. 회차는 비교하지 않음 (다회독 첫 세션은 사진을 붙일 때 새 회차가 없어 이전 회차로 인증됨)
    // - 조건이 안 맞으면 연결하지 않고 저장은 그대로 성공
    private void linkCertification(Long userId, Long certificationId, ReadingSession session) {
        if (certificationId == null) {
            return;
        }
        certificationRepository.findByIdAndUserId(certificationId, userId)
                .filter(Certification::isLinkableToSession)
                .ifPresentOrElse(
                        c -> c.linkSession(session.getId()),
                        () -> log.info("독서 인증을 세션에 연결하지 않음 (없음·남의 것·통과 못 함·이미 쓰임): userId={}, certificationId={}",
                                userId, certificationId));
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
