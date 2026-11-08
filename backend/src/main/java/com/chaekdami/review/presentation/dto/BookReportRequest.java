package com.chaekdami.review.presentation.dto;

import com.chaekdami.review.application.command.BookReportCommand;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BookReportRequest {

    private String content;

    private Boolean isPublic;

    public BookReportCommand toCommand() {
        return new BookReportCommand(content, isPublic);
    }
}
