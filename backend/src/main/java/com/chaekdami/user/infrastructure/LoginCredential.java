package com.chaekdami.user.infrastructure;

/** 로그인 비밀번호 비교에 쓰는 값. 엔티티를 쥐지 않아 토큰 발급 때 최신 회원을 다시 읽는다. */
public record LoginCredential(Long id, String passwordHash) {
}
