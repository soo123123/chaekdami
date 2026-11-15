package com.chaekdami.reading.presentation;

import com.chaekdami.reading.application.ReadingSessionService;
import com.chaekdami.reading.presentation.dto.request.CreateReadingSessionRequest;
import com.chaekdami.reading.presentation.dto.response.ReadingSessionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// userId는 로그인(BE 3) 붙기 전까지 요청 헤더 X-User-Id 로 받음
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ReadingSessionController {

    private static final String USER_ID_HEADER = "X-User-Id";

    private final ReadingSessionService readingSessionService;

    // 독서 종료 저장 — POST /api/reading-sessions
    @PostMapping("/reading-sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public ReadingSessionResponse create(@RequestHeader(USER_ID_HEADER) Long userId,
                                         @RequestBody CreateReadingSessionRequest request) {
        return readingSessionService.create(userId, request);
    }

    // 회차의 세션 목록 — GET /api/reading-records/{id}/sessions
    @GetMapping("/reading-records/{id}/sessions")
    public List<ReadingSessionResponse> getSessions(@RequestHeader(USER_ID_HEADER) Long userId,
                                                    @PathVariable Long id) {
        return readingSessionService.getSessions(userId, id);
    }
}
