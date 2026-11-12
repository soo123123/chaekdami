package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.RewardAccount;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RewardAccountRepository extends JpaRepository<RewardAccount, Long> {

    /** 잠금 대기 최대 시간(ms). 넘기면 PessimisticLockingFailureException 이 발생한다. */
    String LOCK_TIMEOUT_MILLIS = "3000";

    Optional<RewardAccount> findByUserId(Long userId);

    /**
     * 재화/경험치를 변경하기 전에 사용자 보상 계정 행을 잠근다. (SELECT ... FOR UPDATE)
     * 같은 사용자의 동시 요청은 앞 트랜잭션이 끝날 때까지 최대 3초 대기한다.
     * PostgreSQL 에서는 Hibernate 가 조회 직전에 set local lock_timeout 을 걸고 조회 후 원래 값으로 되돌린다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = LOCK_TIMEOUT_MILLIS))
    @Query("select ra from RewardAccount ra where ra.userId = :userId")
    Optional<RewardAccount> findByUserIdWithLock(@Param("userId") Long userId);
}
