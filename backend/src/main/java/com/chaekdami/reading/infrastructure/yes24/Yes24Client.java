package com.chaekdami.reading.infrastructure.yes24;

import com.chaekdami.reading.infrastructure.yes24.dto.Yes24ItemListResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

// YES24 Open API에 실제로 요청을 보내는 클래스
@Component
public class Yes24Client {

    private final RestClient restClient;
    private final String apiKey;

    public Yes24Client(@Value("${yes24.base-url}") String baseUrl,
                       @Value("${yes24.api-key}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-Api-Key", apiKey)   // 인증은 이 헤더로만 됨
                .build();
    }

    // 도서 검색 (detail=N: 목록은 가볍게, "이 책이 맞나?" 확인용 정보만 받음)
    public Yes24ItemListResponse searchBooks(String query, String category, int page, int pageSize) {
        checkApiKey();
        try {
            return restClient.get()
                    .uri(uri -> uri.path("/v1/goods/itemList")
                            .queryParam("query", "{query}")   // 한글, 특수문자가 안전하게 인코딩되도록 변수로 전달
                            .queryParam("category", category)
                            .queryParam("sort", "RELATION")    // 정확도순
                            .queryParam("page", page)
                            .queryParam("pageSize", pageSize)
                            .queryParam("detail", "N")
                            .build(query))
                    .retrieve()
                    .body(Yes24ItemListResponse.class);
        } catch (HttpClientErrorException.NotFound e) {
            return null;   // 404(SEARCH_001)는 에러가 아니라 "검색 결과 없음"
        }
    }

    // 상품 상세 조회 (detail=Y: 쪽수, 책 소개까지 받음) — 검색에서 책을 골랐을 때 사용
    public Yes24ItemListResponse getItemDetail(Long itemId) {
        checkApiKey();
        try {
            return restClient.get()
                    .uri(uri -> uri.path("/v1/goods/itemDetail")
                            .queryParam("searchType", "ItemId")
                            .queryParam("query", itemId)
                            .queryParam("detail", "Y")
                            .build())
                    .retrieve()
                    .body(Yes24ItemListResponse.class);
        } catch (HttpClientErrorException.NotFound e) {
            return null;   // 해당 상품 없음
        }
    }

    private void checkApiKey() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("YES24_API_KEY 환경변수가 설정되지 않았습니다.");
        }
    }
}
