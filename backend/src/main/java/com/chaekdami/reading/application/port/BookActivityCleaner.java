package com.chaekdami.reading.application.port;

/**
 * 서재에서 책을 지울 때 그 책의 독후활동(BE3: 문장·리뷰·독후감·리뷰 좋아요·신고)을 지우는 포트. (스펙 003 R3)
 * 책 삭제와 같은 트랜잭션에서 부른다. 실패하면 예외를 그대로 던져 책 삭제 전체가 취소되게 한다.
 */
public interface BookActivityCleaner {

    /**
     * @param bookId 서재 책 번호 (사용자마다 다름). 다른 사용자의 같은 ISBN 책 데이터는 지우지 않는다
     */
    void deleteAllOfBook(Long bookId);
}
