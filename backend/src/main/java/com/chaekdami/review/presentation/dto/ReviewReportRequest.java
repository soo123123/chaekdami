package com.chaekdami.review.presentation.dto;

import com.chaekdami.review.application.command.ReviewReportCommand;
import com.chaekdami.review.domain.ReportReason;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ReviewReportRequest {

    @NotNull(message = "신고 사유를 선택해야 합니다.")
    private ReportReason reason;

    private String detail;

    public ReviewReportCommand toCommand() {
        return new ReviewReportCommand(reason, detail);
    }
}
