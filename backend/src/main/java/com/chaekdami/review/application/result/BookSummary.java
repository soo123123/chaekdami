package com.chaekdami.review.application.result;

import com.chaekdami.review.application.port.BookView;

public record BookSummary(Long bookId, String title, String author, String coverUrl, Integer totalPages) {

    public static BookSummary from(BookView book) {
        return new BookSummary(book.bookId(), book.title(), book.author(), book.coverUrl(), book.totalPages());
    }
}
