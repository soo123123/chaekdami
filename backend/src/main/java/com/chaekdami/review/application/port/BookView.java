package com.chaekdami.review.application.port;

public record BookView(Long bookId, Long userId, String title, String author,
                       String coverUrl, String isbn, Integer totalPages) {

    public boolean ownedBy(Long userId) {
        return this.userId.equals(userId);
    }
}
