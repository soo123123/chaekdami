package com.chaekdami.reading.presentation;

import com.chaekdami.reading.application.ReadingRecordService;
import com.chaekdami.reading.presentation.dto.request.CreateReadingRecordRequest;
import com.chaekdami.reading.presentation.dto.request.UpdateReadingRecordRequest;
import com.chaekdami.reading.presentation.dto.response.ReadingRecordResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// userId는 로그인(BE 3) 붙기 전까지 요청 헤더 X-User-Id 로 받음
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ReadingRecordController {

    private static final String USER_ID_HEADER = "X-User-Id";

    private final ReadingRecordService readingRecordService;

    // 새 회차 시작 — POST /api/books/{bookId}/reading-records
    @PostMapping("/books/{bookId}/reading-records")
    @ResponseStatus(HttpStatus.CREATED)
    public ReadingRecordResponse create(@RequestHeader(USER_ID_HEADER) Long userId,
                                        @PathVariable Long bookId,
                                        @RequestBody(required = false) CreateReadingRecordRequest request) {
        return readingRecordService.create(userId, bookId, request);
    }

    // 책의 회차별 기록 — GET /api/books/{bookId}/reading-records
    @GetMapping("/books/{bookId}/reading-records")
    public List<ReadingRecordResponse> getRecordsOfBook(@RequestHeader(USER_ID_HEADER) Long userId,
                                                        @PathVariable Long bookId) {
        return readingRecordService.getRecordsOfBook(userId, bookId);
    }

    // 독서 기록 상세 — GET /api/reading-records/{id}
    @GetMapping("/reading-records/{id}")
    public ReadingRecordResponse getRecord(@RequestHeader(USER_ID_HEADER) Long userId,
                                           @PathVariable Long id) {
        return readingRecordService.getRecord(userId, id);
    }

    // 현재 페이지·목표·메모·공개 여부 수정 — PATCH /api/reading-records/{id}
    @PatchMapping("/reading-records/{id}")
    public ReadingRecordResponse update(@RequestHeader(USER_ID_HEADER) Long userId,
                                        @PathVariable Long id,
                                        @RequestBody UpdateReadingRecordRequest request) {
        return readingRecordService.update(userId, id, request);
    }

    // 완독 처리 — POST /api/reading-records/{id}/complete
    @PostMapping("/reading-records/{id}/complete")
    public ReadingRecordResponse complete(@RequestHeader(USER_ID_HEADER) Long userId,
                                          @PathVariable Long id) {
        return readingRecordService.complete(userId, id);
    }
}
