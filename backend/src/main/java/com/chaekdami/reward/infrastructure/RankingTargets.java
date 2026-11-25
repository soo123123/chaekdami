package com.chaekdami.reward.infrastructure;

/**
 * 주간 랭킹에 나올 수 있는 사용자 번호를 고르는 JPQL. 정지 중인 회원과 관리자는 뺀다. (스펙 005 R1.6, R1.7)
 * 정지 기준은 User.isSuspendedAt 과 같다. 회원 테이블은 읽기만 한다. 쓰는 쿼리는 :now 파라미터를 함께 받아야 한다.
 */
final class RankingTargets {

    static final String USER_IDS = """
            (select u.id from User u
             where u.role <> com.chaekdami.user.domain.Role.ADMIN
               and (u.status is null
                    or u.status <> com.chaekdami.user.domain.UserStatus.SUSPENDED
                    or u.suspendedUntil <= :now))
            """;

    private RankingTargets() {
    }
}
