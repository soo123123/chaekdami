package com.chaekdami.review.domain;

import com.chaekdami.global.error.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReviewErrorCode implements ErrorCode {

    CANNOT_LIKE_OWN_REVIEW(400, "내 한줄평에는 좋아요를 누를 수 없습니다."),
    CANNOT_REPORT_OWN_REVIEW(400, "내 한줄평은 신고할 수 없습니다."),
    COMMUNITY_LOCKED(403, "이 책을 완독한 사용자만 볼 수 있습니다."),
    READING_RECORD_NOT_FOUND(404, "독서 기록을 찾을 수 없습니다."),
    BOOK_NOT_FOUND(404, "책을 찾을 수 없습니다."),
    SENTENCE_NOT_FOUND(404, "문장을 찾을 수 없습니다."),
    REVIEW_NOT_FOUND(404, "리뷰를 찾을 수 없습니다."),
    BOOK_REPORT_NOT_FOUND(404, "독후감을 찾을 수 없습니다."),
    COMMUNITY_ENTRY_NOT_FOUND(404, "커뮤니티 항목을 찾을 수 없습니다."),
    READING_NOT_COMPLETED(409, "완독한 뒤에 작성할 수 있습니다."),
    REVIEW_ALREADY_EXISTS(409, "이 책의 리뷰가 이미 있습니다. 수정해 주세요."),
    BOOK_REPORT_ALREADY_EXISTS(409, "이 회차의 독후감이 이미 있습니다. 수정해 주세요."),
    ALREADY_REPORTED(409, "이미 신고한 한줄평입니다.");

    private final int status;
    private final String message;

    @Override
    public String getCode() {
        return name();
    }
}
