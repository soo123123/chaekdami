package com.chaekdami.reading.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 내 서재에 담긴 책 한 권 (사용자마다 따로 저장, 공용 테이블 아님)
@Entity
@Table(
        name = "books",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_books_user_id_item_id",
                columnNames = {"user_id", "item_id"}   // 같은 YES24 책을 내 서재에 두 번 담지 못하게 (수동 책은 item_id가 null이라 제한 없음)
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)   // JPA용 기본 생성자 (외부에서 new Book() 금지)
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // bookId (서재 조회, 삭제, 독서, 리뷰 작성에 사용)

    @Column(name = "user_id", nullable = false)
    private Long userId; // 누구 서재의 책인지 (로그인 붙기 전까지 X-User-Id 헤더 값)

    @Column(name = "item_id")
    private Long itemId; // YES24 상품 번호 (수동 등록한 책은 null)

    @Column(nullable = false)
    private String title; // 책 제목 (필수)

    private String author; // 저자

    private String isbn; // ISBN 13자리, 하이픈 없이 저장 (나중에 같은 책끼리 리뷰 묶을 때 사용, 수동 책은 없을 수 있음)

    private String publisher; // 출판사

    private String publishedDate; // 출간일 (2019-02-26 형태)

    private String coverUrl; // 표지 이미지 주소

    @Column(columnDefinition = "TEXT")
    private String description; // 책 소개 (길어질 수 있어서 TEXT 타입)

    @Column(nullable = false)
    private Integer totalPages; // 전체 페이지 수 (독서율 계산에 사용, 필수)

    public Book(Long userId, Long itemId, String title, String author, String isbn, String publisher,
                String publishedDate, String coverUrl, String description, Integer totalPages) {
        this.userId = userId;
        this.itemId = itemId;
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.publisher = publisher;
        this.publishedDate = publishedDate;
        this.coverUrl = coverUrl;
        this.description = description;
        this.totalPages = totalPages;
    }
}
