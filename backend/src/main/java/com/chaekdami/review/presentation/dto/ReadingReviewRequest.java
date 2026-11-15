package com.chaekdami.review.presentation.dto;

import com.chaekdami.review.application.command.ReadingReviewCommand;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * {@code bookReport} 키를 보내지 않으면 독후감은 그대로 둔다. {@code null}을 보내면 지운다.
 */
@Getter
@NoArgsConstructor
public class ReadingReviewRequest {

    private ReviewWriteRequest review;

    private BookReportRequest bookReport;

    @JsonIgnore
    private boolean bookReportPresent;

    public void setReview(ReviewWriteRequest review) {
        this.review = review;
    }

    public void setBookReport(BookReportRequest bookReport) {
        this.bookReport = bookReport;
        this.bookReportPresent = true;
    }

    public ReadingReviewCommand toCommand() {
        return new ReadingReviewCommand(
                review == null ? null : review.toCommand(),
                bookReportPresent,
                bookReport == null ? null : bookReport.toCommand());
    }
}
