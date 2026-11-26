package com.chaekdami.review.application;

import com.chaekdami.review.application.command.ReviewReportCommand;
import com.chaekdami.review.domain.ReportReason;
import com.chaekdami.review.domain.ReviewReport;
import com.chaekdami.user.application.exception.InvalidRequestException;

/** 한줄평·독후감·문장 신고가 함께 쓰는 입력 규칙. */
final class ReportRules {

    private ReportRules() {
    }

    static void validate(ReviewReportCommand command) {
        if (command.reason() == null) {
            throw new InvalidRequestException("reason", "신고 사유를 선택해야 합니다.");
        }
        String detail = detailOf(command);
        if (command.reason() == ReportReason.OTHER && detail == null) {
            throw new InvalidRequestException("detail", "기타 사유는 내용을 입력해야 합니다.");
        }
        if (detail != null && detail.length() > ReviewReport.MAX_DETAIL_LENGTH) {
            throw new InvalidRequestException("detail",
                    "신고 내용은 " + ReviewReport.MAX_DETAIL_LENGTH + "자 이하여야 합니다.");
        }
    }

    static String detailOf(ReviewReportCommand command) {
        return command.detail() == null || command.detail().isBlank() ? null : command.detail().strip();
    }
}
