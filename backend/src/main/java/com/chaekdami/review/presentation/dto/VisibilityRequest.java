package com.chaekdami.review.presentation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class VisibilityRequest {

    @NotNull(message = "공개 여부를 입력해야 합니다.")
    private Boolean isPublic;
}
