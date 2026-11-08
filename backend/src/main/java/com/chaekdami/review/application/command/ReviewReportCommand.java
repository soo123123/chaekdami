package com.chaekdami.review.application.command;

import com.chaekdami.review.domain.ReportReason;

public record ReviewReportCommand(ReportReason reason, String detail) {
}
