package com.chaekdami.reward.application.port;

import java.util.Collection;
import java.util.Map;

/**
 * 회원 도메인의 닉네임을 읽는 포트. 랭킹에 닉네임을 보여줄 때 쓴다.
 */
public interface UserNicknameReader {

    /**
     * 사용자 번호 → 닉네임. 없는 사용자(탈퇴 등)는 결과에 넣지 않는다.
     */
    Map<Long, String> findNicknames(Collection<Long> userIds);
}
