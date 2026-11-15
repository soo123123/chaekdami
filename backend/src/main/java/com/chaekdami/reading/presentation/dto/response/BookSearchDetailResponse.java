package com.chaekdami.reading.presentation.dto.response;

// 검색에서 고른 책 한 권의 상세 정보 (등록 화면을 미리 채우는 용도)
// 필드명이 CreateBookRequest와 같아서, 사용자가 확인/수정한 뒤 그대로 POST /api/books 로 보내면 됨
public record BookSearchDetailResponse(
        Long itemId,            // YES24 상품 번호
        String title,           // 책 제목
        String author,          // 저자
        String isbn,            // ISBN
        String publisher,       // 출판사
        String publishedDate,   // 출간일 (2019-02-26 형태)
        String coverUrl,        // 표지 이미지 주소
        String description,     // 책 소개 (없으면 null)
        Integer totalPages      // 전체 페이지 수 (없으면 null → 등록 화면에서 직접 입력)
) {}
