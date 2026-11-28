package com.chaekdami.reward.presentation;

import com.chaekdami.reward.application.PurchaseResult;
import com.chaekdami.reward.application.ShopService;
import com.chaekdami.reward.domain.RewardErrorCode;
import com.chaekdami.reward.domain.RewardException;
import com.chaekdami.user.presentation.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 구매 요청 본문을 서비스에 그대로 넘기는지, 오류가 정한 코드로 나가는지 확인한다. (스펙 016)
 */
@ExtendWith(MockitoExtension.class)
class ShopControllerTest {

    private static final Long USER_ID = 1L;
    private static final Long ITEM_ID = 3L;

    @Mock
    private ShopService shopService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ShopController(shopService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void 보유_개수를_서비스에_넘긴다() throws Exception {
        when(shopService.purchase(USER_ID, ITEM_ID, 2, 5))
                .thenReturn(new PurchaseResult(45L, ITEM_ID, "EXP 부스터 1개", 600, 7));

        mockMvc.perform(purchase("{\"purchaseQuantity\": 2, \"ownedQuantity\": 5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.purchaseId").value(45))
                .andExpect(jsonPath("$.remainingCurrency").value(600))
                .andExpect(jsonPath("$.updatedInventoryQuantity").value(7));
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"purchaseQuantity\": 1}", "{\"purchaseQuantity\": 1, \"ownedQuantity\": null}"})
    void 보유_개수가_없으면_비교하지_않도록_null_을_넘긴다(String body) throws Exception {
        mockMvc.perform(purchase(body)).andExpect(status().isOk());

        verify(shopService).purchase(USER_ID, ITEM_ID, 1, null);
    }

    @Test
    void 본문이_없으면_1개를_구매하고_비교하지_않는다() throws Exception {
        mockMvc.perform(post("/api/shop/items/{itemId}/purchase", ITEM_ID)
                        .header("X-User-Id", USER_ID)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(shopService).purchase(USER_ID, ITEM_ID, 1, null);
    }

    @Test
    void 보유_개수가_다르면_409_SHOP_002() throws Exception {
        when(shopService.purchase(any(), any(), anyInt(), any()))
                .thenThrow(new RewardException(RewardErrorCode.ITEM_COUNT_CHANGED));

        mockMvc.perform(purchase("{\"ownedQuantity\": 2}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("SHOP_002"))
                .andExpect(jsonPath("$.message").value("상품 보유 개수가 달라졌습니다. 개수를 확인해 주세요."));
    }

    @Test
    void 요청이_겹친_409_는_CONCURRENCY_001_로_구분된다() throws Exception {
        when(shopService.purchase(any(), any(), anyInt(), any()))
                .thenThrow(new RewardException(RewardErrorCode.CONCURRENT_REQUEST));

        mockMvc.perform(purchase("{\"ownedQuantity\": 2}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONCURRENCY_001"));
    }

    @Test
    void 서비스가_거절한_값은_400_VALIDATION_ERROR() throws Exception {
        when(shopService.purchase(USER_ID, ITEM_ID, 1, -1))
                .thenThrow(new IllegalArgumentException("보유 개수는 0 이상이어야 합니다. (입력: -1)"));

        mockMvc.perform(purchase("{\"ownedQuantity\": -1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"\"many\"", "2.7", "2.0", "\"2\"", "1e1", "true", "3000000000"})
    void 보유_개수가_JSON_정수가_아니면_400_VALIDATION_ERROR(String ownedQuantity) throws Exception {
        mockMvc.perform(purchase("{\"ownedQuantity\": " + ownedQuantity + "}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        verifyNoInteractions(shopService);
    }

    private MockHttpServletRequestBuilder purchase(String body) {
        return post("/api/shop/items/{itemId}/purchase", ITEM_ID)
                .header("X-User-Id", USER_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body);
    }
}
