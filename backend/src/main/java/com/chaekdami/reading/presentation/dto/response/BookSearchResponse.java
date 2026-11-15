package com.chaekdami.reading.presentation.dto.response;

import java.util.List;

// 도서 검색 결과 (목록용, 가볍게: "이 책이 맞나?" 확인용 정보만)
public record BookSearchResponse(
        List<Item> items,   // 검색 결과 목록
        int page,           // 현재 페이지
        int pageSize,       // 페이지 크기
        int totalCount      // 전체 검색 결과 수 (YES24 기준, 걸러낸 항목 포함)
) {

    // 검색 결과 책 한 권
    public record Item(
            Long itemId,            // YES24 상품 번호 (책을 고르면 이 값으로 상세 조회)
            String isbn,            // ISBN
            String title,           // 책 제목
            String author,          // 저자
            String publisher,       // 출판사
            String publishedDate,   // 출간일 (2019-02-26 형태)
            String coverUrl         // 표지 이미지 주소
    ) {}
}
