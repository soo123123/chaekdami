package com.chaekdami.review.presentation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BlindRequest {

    @NotNull(message = "블라인드 여부를 입력해야 합니다.")
    private Boolean blinded;
}
