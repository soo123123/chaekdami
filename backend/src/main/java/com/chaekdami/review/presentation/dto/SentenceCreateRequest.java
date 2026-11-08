package com.chaekdami.review.presentation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SentenceCreateRequest {

    @NotBlank(message = "문장을 입력해야 합니다.")
    private String content;

    private Integer pageNumber;
}
