package com.chaekdami.review.presentation.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 보내지 않은 필드는 그대로 둔다. {@code "pageNumber": null}을 보내면 쪽 번호를 지운다.
 */
@Getter
@NoArgsConstructor
public class SentenceUpdateRequest {

    private String content;

    private Integer pageNumber;

    @JsonIgnore
    private boolean pageNumberPresent;

    public void setContent(String content) {
        this.content = content;
    }

    public void setPageNumber(Integer pageNumber) {
        this.pageNumber = pageNumber;
        this.pageNumberPresent = true;
    }
}
