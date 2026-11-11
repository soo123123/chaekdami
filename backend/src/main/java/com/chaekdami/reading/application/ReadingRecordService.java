package com.chaekdami.reading.application;

import com.chaekdami.reading.domain.Book;
import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.domain.ReadingStatus;
import com.chaekdami.reading.infrastructure.BookRepository;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.reading.presentation.dto.request.CreateReadingRecordRequest;
import com.chaekdami.reading.presentation.dto.request.UpdateReadingRecordRequest;
import com.chaekdami.reading.presentation.dto.response.ReadingRecordResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReadingRecordService {

    private final BookRepository bookRepository;
    private final ReadingRecordRepository readingRecordRepository;

    // 새 회차 시작 (처음 읽기 or 다회독)
    @Transactional
    public ReadingRecordResponse create(Long userId, Long bookId, CreateReadingRecordRequest request) {
        Book book = findMyBook(userId, bookId);

        // 끝나지 않은 회차가 있으면 새로 시작할 수 없음
        if (readingRecordRepository.existsByBookIdAndStatusNot(bookId, ReadingStatus.COMPLETED)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "진행 중인 독서 기록이 있습니다. 완독 후 새 회차를 시작할 수 있습니다.");
        }

        int nextRound = readingRecordRepository.findFirstByBookIdOrderByRoundDesc(bookId)
                .map(last -> last.getRound() + 1)
                .orElse(1);

        ReadingRecord record = ReadingRecord.start(book, nextRound);
        if (request != null) {
            apply(record, request.currentPage(), request.goalDate(), request.goalPage(),
                    request.memo(), request.isPublic());
        }

        try {
            return ReadingRecordResponse.from(readingRecordRepository.saveAndFlush(record));
        } catch (DataIntegrityViolationException e) {
            // 같은 회차를 거의 동시에 두 번 만든 경우
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 시작된 회차입니다.");
        }
    }

    // 책의 회차별 기록 (과거 기록 비교용, 최신 회차 먼저)
    public List<ReadingRecordResponse> getRecordsOfBook(Long userId, Long bookId) {
        findMyBook(userId, bookId);
        return readingRecordRepository.findAllByBookIdOrderByRoundDesc(bookId).stream()
                .map(ReadingRecordResponse::from)
                .toList();
    }

    // 독서 기록 상세
    public ReadingRecordResponse getRecord(Long userId, Long recordId) {
        return ReadingRecordResponse.from(findMyRecord(userId, recordId));
    }

    // 현재 페이지, 목표, 메모, 공개 여부 수정 (보낸 값만)
    @Transactional
    public ReadingRecordResponse update(Long userId, Long recordId, UpdateReadingRecordRequest request) {
        ReadingRecord record = findMyRecord(userId, recordId);
        apply(record, request.currentPage(), request.goalDate(), request.goalPage(),
                request.memo(), request.isPublic());
        return ReadingRecordResponse.from(record);
    }

    // 완독 처리
    @Transactional
    public ReadingRecordResponse complete(Long userId, Long recordId) {
        ReadingRecord record = findMyRecord(userId, recordId);
        record.complete(LocalDateTime.now());
        // TODO: BE2(보상)에 완독 이벤트 전달 — 연동 방식 협의 후
        return ReadingRecordResponse.from(record);
    }

    // 요청 값을 기록에 반영 (null인 항목은 건너뜀)
    private void apply(ReadingRecord record, Integer currentPage, java.time.LocalDate goalDate,
                       Integer goalPage, String memo, Boolean isPublic) {
        if (goalDate != null || goalPage != null) {
            record.changeGoal(
                    goalDate != null ? goalDate : record.getGoalDate(),
                    goalPage != null ? goalPage : record.getGoalPage());
        }
        if (memo != null) {
            record.changeMemo(memo.isBlank() ? null : memo.trim());
        }
        if (isPublic != null) {
            record.changePublic(isPublic);
        }
        if (currentPage != null) {
            record.updatePage(currentPage, LocalDateTime.now());   // 마지막에: 완독되면 이후 수정이 막히므로
        }
    }

    private Book findMyBook(Long userId, Long bookId) {
        return bookRepository.findByIdAndUserId(bookId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "책을 찾을 수 없습니다: " + bookId));
    }

    private ReadingRecord findMyRecord(Long userId, Long recordId) {
        return readingRecordRepository.findByIdAndUserId(recordId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "독서 기록을 찾을 수 없습니다: " + recordId));
    }
}
