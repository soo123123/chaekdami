package com.chaekdami.reading.application;

import com.chaekdami.reading.domain.Book;
import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.domain.ReadingStatus;
import com.chaekdami.reading.infrastructure.BookRepository;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.reading.presentation.dto.request.CreateBookRequest;
import com.chaekdami.reading.presentation.dto.response.BookResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service   // 이 클래스가 Spring이 관리하는 서비스 계층임을 표시
@RequiredArgsConstructor   // final 필드를 자동으로 생성자 주입해줌
@Transactional(readOnly = true)   // 기본은 조회 전용, 저장/삭제 메서드만 따로 @Transactional
public class BookService {

    private final BookRepository bookRepository;
    private final ReadingRecordRepository readingRecordRepository;

    // 내 서재에 책 등록 (YES24 책, 수동 책 공통) + 1회차 독서 기록(읽기 전) 자동 생성
    @Transactional
    public BookResponse createBook(Long userId, CreateBookRequest request) {
        if (request.title() == null || request.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "책 제목을 입력해주세요.");
        }
        if (request.totalPages() == null || request.totalPages() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "전체 쪽수는 1 이상이어야 합니다.");
        }
        // YES24 책이면 내 서재에 이미 있는지 확인
        if (request.itemId() != null && bookRepository.existsByUserIdAndItemId(userId, request.itemId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 서재에 있는 책입니다.");
        }

        Book book = new Book(
                userId,
                request.itemId(),
                request.title().trim(),
                request.author(),
                normalizeIsbn(request.isbn()),
                request.publisher(),
                request.publishedDate(),
                request.coverUrl(),
                request.description(),
                request.totalPages()
        );

        Book saved;
        try {
            saved = bookRepository.saveAndFlush(book);   // flush로 유니크 제약 위반을 여기서 바로 확인
        } catch (DataIntegrityViolationException e) {
            // 같은 책을 거의 동시에 두 번 등록한 경우 (exists 확인을 통과해도 DB 유니크 제약이 막아줌)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 서재에 있는 책입니다.");
        }

        // 서재에 담는 순간 1회차 기록을 "읽기 전" 상태로 만들어 둠 (서재의 읽기 전 / 읽는 중 / 완독 필터용)
        ReadingRecord firstRecord = readingRecordRepository.save(ReadingRecord.start(saved, 1));

        return BookResponse.from(saved, firstRecord);
    }

    // 내 서재 목록 (최근 등록순) — status를 주면 최근 회차 상태로 필터 (읽기 전 / 읽는 중 / 완독)
    public List<BookResponse> getBooks(Long userId, ReadingStatus status) {
        // 책마다 쿼리하지 않도록 내 기록을 한 번에 가져와서 책별 최근 회차만 남김
        Map<Long, ReadingRecord> latestByBookId = readingRecordRepository.findAllByUserId(userId).stream()
                .collect(Collectors.toMap(
                        record -> record.getBook().getId(),
                        Function.identity(),
                        (a, b) -> a.getRound() >= b.getRound() ? a : b));

        return bookRepository.findAllByUserIdOrderByIdDesc(userId).stream()
                .map(book -> BookResponse.from(book, latestByBookId.get(book.getId())))
                .filter(response -> status == null
                        || (response.currentReading() != null && response.currentReading().status() == status))
                .toList();
    }

    // 내 책 상세 (최근 회차 상태 포함)
    public BookResponse getBook(Long userId, Long bookId) {
        Book book = findMyBook(userId, bookId);
        ReadingRecord latest = readingRecordRepository.findFirstByBookIdOrderByRoundDesc(bookId).orElse(null);
        return BookResponse.from(book, latest);
    }

    // 서재에서 제거 (딸린 독서 기록도 함께 삭제)
    @Transactional
    public void deleteBook(Long userId, Long bookId) {
        Book book = findMyBook(userId, bookId);
        readingRecordRepository.deleteAllByBookId(bookId);
        bookRepository.delete(book);
    }

    // 내 책만 찾기 (남의 bookId면 404)
    private Book findMyBook(Long userId, Long bookId) {
        return bookRepository.findByIdAndUserId(bookId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "책을 찾을 수 없습니다: " + bookId));
    }

    // "979-11-6254-064-0" → "9791162540640" (하이픈, 공백 제거, 빈 값은 null)
    private String normalizeIsbn(String isbn) {
        if (isbn == null) {
            return null;
        }
        String digits = isbn.replaceAll("[^0-9Xx]", "");
        return digits.isEmpty() ? null : digits.toUpperCase();
    }
}
