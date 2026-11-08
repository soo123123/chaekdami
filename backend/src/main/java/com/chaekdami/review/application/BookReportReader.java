package com.chaekdami.review.application;

import com.chaekdami.review.application.result.BookReportResult;

import java.util.Optional;

/**
 * 다른 도메인(AI 피드백)이 독후감 본문과 revision을 읽을 때 쓴다. 소유권은 호출하는 쪽에서 확인한다.
 */
public interface BookReportReader {

    Optional<BookReportResult> find(Long bookReportId);
}
