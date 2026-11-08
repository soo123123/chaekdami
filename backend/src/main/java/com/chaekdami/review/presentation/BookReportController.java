package com.chaekdami.review.presentation;

import com.chaekdami.review.application.BookReportService;
import com.chaekdami.review.presentation.dto.BookReportRequest;
import com.chaekdami.review.presentation.dto.BookReportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class BookReportController {

    private final BookReportService bookReportService;

    @GetMapping("/api/book-reports/{bookReportId}")
    public ResponseEntity<BookReportResponse> get(@PathVariable Long bookReportId) {
        return ResponseEntity.ok(BookReportResponse.from(bookReportService.get(bookReportId)));
    }

    @PatchMapping("/api/book-reports/{bookReportId}")
    public ResponseEntity<BookReportResponse> update(@PathVariable Long bookReportId,
                                                     @RequestBody BookReportRequest request) {
        return ResponseEntity.ok(BookReportResponse.from(
                bookReportService.update(bookReportId, request.toCommand())));
    }

    @DeleteMapping("/api/book-reports/{bookReportId}")
    public ResponseEntity<Void> delete(@PathVariable Long bookReportId) {
        bookReportService.delete(bookReportId);
        return ResponseEntity.noContent().build();
    }
}
