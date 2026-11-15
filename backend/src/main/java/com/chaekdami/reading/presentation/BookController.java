package com.chaekdami.reading.presentation;

import com.chaekdami.reading.application.BookSearchService;
import com.chaekdami.reading.application.BookService;
import com.chaekdami.reading.domain.ReadingStatus;
import com.chaekdami.reading.presentation.dto.request.CreateBookRequest;
import com.chaekdami.reading.presentation.dto.response.BookResponse;
import com.chaekdami.reading.presentation.dto.response.BookSearchDetailResponse;
import com.chaekdami.reading.presentation.dto.response.BookSearchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// userId는 로그인(BE 3) 붙기 전까지 요청 헤더 X-User-Id 로 받음
@RestController   // 이 클래스가 HTTP 요청을 받아 JSON으로 응답하는 컨트롤러임을 표시
@RequiredArgsConstructor   // final 필드를 자동으로 생성자 주입해줌
@RequestMapping("/api/books")   // 이 컨트롤러의 모든 API는 /api/books로 시작
public class BookController {

    private static final String USER_ID_HEADER = "X-User-Id";

    private final BookSearchService bookSearchService;
    private final BookService bookService;

    // ① 도서 검색 — GET /api/books/search?query=...&category=BOOK&page=1&pageSize=20
    @GetMapping("/search")
    public BookSearchResponse searchBooks(
            @RequestParam String query,
            @RequestParam(defaultValue = "BOOK") String category,   // ALL, BOOK(국내), FOREIGN(해외), EBOOK(전자책)
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return bookSearchService.search(query, category, page, pageSize);
    }

    // ② 고른 책 상세 (등록 화면 채우기용) — GET /api/books/search/{itemId}
    @GetMapping("/search/{itemId}")
    public BookSearchDetailResponse getSearchDetail(@PathVariable Long itemId) {
        return bookSearchService.getDetail(itemId);
    }

    // ③ 내 서재에 책 등록 (YES24 책, 수동 책 공통) — POST /api/books
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookResponse createBook(@RequestHeader(USER_ID_HEADER) Long userId,
                                   @RequestBody CreateBookRequest request) {
        return bookService.createBook(userId, request);
    }

    // 내 서재 목록 — GET /api/books?status=IN_PROGRESS (status 생략 시 전체)
    @GetMapping
    public List<BookResponse> getBooks(@RequestHeader(USER_ID_HEADER) Long userId,
                                       @RequestParam(required = false) ReadingStatus status) {
        return bookService.getBooks(userId, status);
    }

    // 내 책 상세 — GET /api/books/{bookId}
    @GetMapping("/{bookId}")
    public BookResponse getBook(@RequestHeader(USER_ID_HEADER) Long userId,
                                @PathVariable Long bookId) {
        return bookService.getBook(userId, bookId);
    }

    // 서재에서 제거 — DELETE /api/books/{bookId}
    @DeleteMapping("/{bookId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBook(@RequestHeader(USER_ID_HEADER) Long userId,
                           @PathVariable Long bookId) {
        bookService.deleteBook(userId, bookId);
    }
}
