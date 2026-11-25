package com.chaekdami.review.application.port;

public interface UserSuspensionReader {

    boolean isSuspended(Long userId);
}
