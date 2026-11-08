package com.chaekdami.review.presentation.dto;

import com.chaekdami.review.application.command.ReviewWriteCommand;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 보내지 않은 필드는 그대로 둔다. {@code "oneLine": ""}을 보내면 한줄평을 지운다.
 */
@Getter
@NoArgsConstructor
public class ReviewWriteRequest {

    private Integer rating;

    private String oneLine;

    private Boolean isSpoiler;

    private Boolean isPublic;

    public ReviewWriteCommand toCommand() {
        return new ReviewWriteCommand(rating, oneLine, isSpoiler, isPublic);
    }
}
