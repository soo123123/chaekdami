package com.chaekdami.review.application;

import com.chaekdami.user.application.exception.InvalidRequestException;
import org.springframework.data.domain.PageRequest;

public final class Paging {

    public static final int MAX_SIZE = 50;

    private Paging() {
    }

    public static PageRequest of(int page, int size) {
        if (page < 0) {
            throw new InvalidRequestException("page", "page는 0 이상이어야 합니다.");
        }
        if (size < 1 || size > MAX_SIZE) {
            throw new InvalidRequestException("size", "size는 1 이상 " + MAX_SIZE + " 이하여야 합니다.");
        }
        return PageRequest.of(page, size);
    }
}
