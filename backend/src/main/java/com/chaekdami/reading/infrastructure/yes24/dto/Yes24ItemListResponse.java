package com.chaekdami.reading.infrastructure.yes24.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

// YES24 상품 검색(itemList) / 상세(itemDetail) 응답 (둘 다 data.items[] 구조라 같이 사용)
// 우리가 쓰는 필드만 골라 받고 나머지는 무시
@JsonIgnoreProperties(ignoreUnknown = true)
public record Yes24ItemListResponse(
        PagedData data   // 실제 데이터가 들어있는 부분
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PagedData(
            List<GoodsItem> items,   // 결과 목록 (상세 조회는 1건)
            Integer currentPage,     // 현재 페이지
            Integer pageSize,        // 페이지 크기
            Integer totalCount       // 전체 결과 수
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GoodsItem(
            Long itemId,                  // YES24 상품 번호
            String title,                 // 책 제목
            String author,                // 저자 ("제임스 클리어 저/이한이 역" 형태)
            String publisher,             // 출판사
            String isbn13,                // ISBN 13자리 (세트 상품은 빈 문자열)
            String publishDate,           // 출간일 ("20190226" 형태)
            String cover,                 // 표지 이미지 주소
            Integer pages,                // 쪽수 (detail=Y 일 때만 옴, 없는 책은 null)
            ContentDetail contentDetail   // 책 소개 등 (detail=Y 일 때만 옴)
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ContentDetail(
            String bookIntroduction   // 책 소개글
    ) {}
}
