package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.RewardAccount;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RewardAccountRepository extends JpaRepository<RewardAccount, Long> {

    /** 잠금 대기 최대 시간(ms). 넘기면 PessimisticLockingFailureException 이 발생한다. */
    String LOCK_TIMEOUT_MILLIS = "3000";

    Optional<RewardAccount> findByUserId(Long userId);

    List<RewardAccount> findAllByUserIdIn(Collection<Long> userIds);

    /**
     * 재화/경험치를 변경하기 전에 사용자 보상 계정 행을 잠근다. (SELECT ... FOR UPDATE)
     * 같은 사용자의 동시 요청은 앞 트랜잭션이 끝날 때까지 최대 3초 대기한다.
     * PostgreSQL 에서는 Hibernate 가 조회 직전에 set local lock_timeout 을 걸고 조회 후 원래 값으로 되돌린다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = LOCK_TIMEOUT_MILLIS))
    @Query("select ra from RewardAccount ra where ra.userId = :userId")
    Optional<RewardAccount> findByUserIdWithLock(@Param("userId") Long userId);

    @Modifying(flushAutomatically = true)
    @Query("delete from RewardAccount ra where ra.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);

    /**
     * 계정이 없을 때만 저장한다. 같은 사용자의 동시 요청이 먼저 만들었으면 오류 없이 아무것도 하지 않는다.
     * 중복 오류가 나지 않아 호출한 트랜잭션을 그대로 이어 쓸 수 있으므로 별도 트랜잭션(DB 연결)이 필요 없다. (ISSUE-BUG-29)
     * 직접 쓴 SQL 이라 JPA Auditing 이 적용되지 않으므로 now 를 생성·수정 시각으로 저장한다.
     *
     * @return 저장했으면 1, 이미 있으면 0
     */
    @Modifying
    @Query(value = "insert into reward_accounts"
            + " (user_id, currency, experience, level, dday, max_dday, created_at, updated_at)"
            + " values (:#{#account.userId}, :#{#account.currency}, :#{#account.experience}, :#{#account.level},"
            + " :#{#account.dday}, :#{#account.maxDday}, :now, :now)"
            + " on conflict do nothing", nativeQuery = true)
    int insertIfAbsent(@Param("account") RewardAccount account, @Param("now") LocalDateTime now);
}
