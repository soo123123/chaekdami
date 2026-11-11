package com.chaekdami.reading.presentation.dto.response;

import com.chaekdami.reading.domain.Book;
import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.domain.ReadingStatus;

// 내 서재의 책 정보를 응답할 때 쓰는 데이터
public record BookResponse(
        Long id,                    // bookId
        Long itemId,                // YES24 상품 번호 (수동 책은 null)
        String title,               // 책 제목
        String author,              // 저자
        String isbn,                // ISBN
        String publisher,           // 출판사
        String publishedDate,       // 출간일
        String coverUrl,            // 표지 이미지 주소
        String description,         // 책 소개
        Integer totalPages,         // 전체 페이지 수
        CurrentReading currentReading  // 가장 최근 회차의 독서 상태 (기록이 없으면 null)
) {

    // 서재 카드에 보여줄 최근 회차 요약
    public record CurrentReading(
            Long recordId,          // 독서 기록 번호 (페이지 갱신, 완독 등에 사용)
            Integer round,          // 회차
            ReadingStatus status,   // NOT_STARTED / IN_PROGRESS / COMPLETED
            Integer currentPage,    // 현재 페이지
            Integer progressRate    // 독서율 (%)
    ) {
        public static CurrentReading from(ReadingRecord record) {
            if (record == null) {
                return null;
            }
            return new CurrentReading(
                    record.getId(),
                    record.getRound(),
                    record.getStatus(),
                    record.getCurrentPage(),
                    record.getProgressRate()
            );
        }
    }

    // Entity(Book) + 최근 회차 기록을 Response DTO로 변환
    public static BookResponse from(Book book, ReadingRecord latestRecord) {
        return new BookResponse(
                book.getId(),
                book.getItemId(),
                book.getTitle(),
                book.getAuthor(),
                book.getIsbn(),
                book.getPublisher(),
                book.getPublishedDate(),
                book.getCoverUrl(),
                book.getDescription(),
                book.getTotalPages(),
                CurrentReading.from(latestRecord)
        );
    }
}
