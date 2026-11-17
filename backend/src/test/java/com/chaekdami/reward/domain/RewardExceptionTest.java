package com.chaekdami.reward.domain;

import com.chaekdami.global.error.BusinessException;
import com.chaekdami.user.presentation.GlobalExceptionHandler;
import com.chaekdami.user.presentation.dto.ApiErrorResponse;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class RewardExceptionTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @ParameterizedTest
    @EnumSource(RewardErrorCode.class)
    void 공용_핸들러가_보상_에러_코드의_상태와_코드로_응답한다(RewardErrorCode errorCode) {
        RewardException exception = new RewardException(errorCode);

        ResponseEntity<ApiErrorResponse> response = handler.handleBusiness(exception);

        assertThat(exception).isInstanceOf(BusinessException.class);
        assertThat(response.getStatusCode().value()).isEqualTo(errorCode.getStatus());
        assertThat(response.getBody().code()).isEqualTo(errorCode.getCode());
        assertThat(response.getBody().message()).isEqualTo(errorCode.getMessage());
    }
}
