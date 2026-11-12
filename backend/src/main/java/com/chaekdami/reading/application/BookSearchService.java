package com.chaekdami.reading.application;

import com.chaekdami.reading.infrastructure.yes24.Yes24Client;
import com.chaekdami.reading.infrastructure.yes24.dto.Yes24ItemListResponse;
import com.chaekdami.reading.presentation.dto.response.BookSearchDetailResponse;
import com.chaekdami.reading.presentation.dto.response.BookSearchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BookSearchService {

    private static final Set<String> ALLOWED_CATEGORIES = Set.of("ALL", "BOOK", "FOREIGN", "EBOOK");
    private static final int MAX_PAGE_SIZE = 50;   // 응답이 커지는 걸 막는 상한

    private final Yes24Client yes24Client;

    // ① 검색: 제목, 저자, 출판사, 표지로 "이 책이 맞나?" 확인용 목록
    public BookSearchResponse search(String query, String category, int page, int pageSize) {
        if (query == null || query.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "검색어를 입력해주세요.");
        }
        String upperCategory = category == null ? "BOOK" : category.toUpperCase();   // all, ALL 둘 다 허용
        if (!ALLOWED_CATEGORIES.contains(upperCategory)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 카테고리입니다: " + category);
        }
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);

        Yes24ItemListResponse response = yes24Client.searchBooks(query.trim(), upperCategory, safePage, safeSize);

        // 검색 결과가 없으면 빈 목록으로 응답
        if (response == null || response.data() == null || response.data().items() == null) {
            return new BookSearchResponse(List.of(), safePage, safeSize, 0);
        }

        List<BookSearchResponse.Item> items = response.data().items().stream()
                .filter(item -> item.isbn13() != null && !item.isbn13().isBlank())   // ISBN 없는 세트 상품 제외
                .map(item -> new BookSearchResponse.Item(
                        item.itemId(),
                        item.isbn13(),
                        item.title(),
                        item.author(),
                        item.publisher(),
                        formatDate(item.publishDate()),
                        item.cover()
                ))
                .toList();

        int totalCount = response.data().totalCount() == null ? 0 : response.data().totalCount();
        return new BookSearchResponse(items, safePage, safeSize, totalCount);
    }

    // ② 상세: 고른 책 한 권의 쪽수, 소개 등 (등록 화면을 미리 채우는 용도)
    public BookSearchDetailResponse getDetail(Long itemId) {
        Yes24ItemListResponse response = yes24Client.getItemDetail(itemId);

        if (response == null || response.data() == null
                || response.data().items() == null || response.data().items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "YES24에서 책을 찾을 수 없습니다: " + itemId);
        }

        Yes24ItemListResponse.GoodsItem item = response.data().items().get(0);
        String description = item.contentDetail() == null ? null : item.contentDetail().bookIntroduction();
        return new BookSearchDetailResponse(
                item.itemId(),
                item.title(),
                item.author(),
                item.isbn13(),
                item.publisher(),
                formatDate(item.publishDate()),
                item.cover(),
                description,
                item.pages()
        );
    }

    // "20190226" -> "2019-02-26"
    private String formatDate(String yyyyMMdd) {
        if (yyyyMMdd == null || yyyyMMdd.length() != 8) {
            return yyyyMMdd;
        }
        return yyyyMMdd.substring(0, 4) + "-" + yyyyMMdd.substring(4, 6) + "-" + yyyyMMdd.substring(6, 8);
    }
}
