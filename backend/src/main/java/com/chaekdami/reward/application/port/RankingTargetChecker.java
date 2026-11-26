package com.chaekdami.reward.application.port;

import java.time.LocalDateTime;

/**
 * 회원 도메인을 읽어 주간 랭킹 대상인지 확인하는 포트.
 */
public interface RankingTargetChecker {

    /**
     * 정지 중인 회원, 관리자, 없는 사용자면 false.
     *
     * @param now 서버 시각 (정지가 풀렸는지 판단)
     */
    boolean isTarget(Long userId, LocalDateTime now);
}
