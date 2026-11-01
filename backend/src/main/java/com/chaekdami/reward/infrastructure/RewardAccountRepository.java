package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.RewardAccount;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RewardAccountRepository extends JpaRepository<RewardAccount, Long> {

    Optional<RewardAccount> findByUserId(Long userId);

    /**
     * 재화/경험치를 변경하기 전에 사용자 보상 계정 행을 잠근다. (SELECT ... FOR UPDATE)
     * 같은 사용자의 동시 요청은 트랜잭션이 끝날 때까지 대기한다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select ra from RewardAccount ra where ra.userId = :userId")
    Optional<RewardAccount> findByUserIdWithLock(@Param("userId") Long userId);
}
