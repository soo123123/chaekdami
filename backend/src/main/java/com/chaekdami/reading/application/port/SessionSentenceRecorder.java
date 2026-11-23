package com.chaekdami.reading.application.port;

/**
 * 독서 세션 저장 때 요청의 문장을 독후활동(BE3) 문장으로 저장하는 포트. (스펙 003 R1)
 * 세션 저장과 같은 트랜잭션에서 부른다. 문장 규칙을 어기면 예외를 그대로 던져 세션 저장까지 취소되게 한다.
 */
public interface SessionSentenceRecorder {

    /**
     * 문장이 비어 있거나 공백뿐이면 아무것도 하지 않는다.
     *
     * @param pageNumber 문장 쪽 번호 (세션의 endPage). 1 미만이면 쪽 번호 없이 저장
     */
    void record(Long userId, Long readingRecordId, String sentence, Integer pageNumber);
}
