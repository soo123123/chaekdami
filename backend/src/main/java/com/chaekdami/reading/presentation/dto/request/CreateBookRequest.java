package com.chaekdami.reading.presentation.dto.request;

// 책 등록 요청 시 클라이언트가 보내는 데이터
// - YES24 책: GET /api/books/search/{itemId} 응답을 그대로 보내면 됨 (필드명 동일)
// - 수동 책: itemId 없이 직접 입력한 값을 보냄
public record CreateBookRequest(
        Long itemId,            // YES24 상품 번호 (수동 등록이면 null)
        String title,           // 책 제목 (필수)
        String author,          // 저자
        String isbn,            // ISBN
        String publisher,       // 출판사
        String publishedDate,   // 출간일
        String coverUrl,        // 표지 이미지 주소
        String description,     // 책 소개
        Integer totalPages      // 전체 페이지 수 (필수, 1 이상)
) {}
