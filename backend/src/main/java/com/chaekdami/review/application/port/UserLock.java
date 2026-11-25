package com.chaekdami.review.application.port;

public interface UserLock {

    /** 트랜잭션이 끝날 때까지 회원 행을 잠가 같은 회원의 요청을 한 줄로 세운다. */
    void lock(Long userId);
}
