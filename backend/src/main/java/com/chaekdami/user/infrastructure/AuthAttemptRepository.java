package com.chaekdami.user.infrastructure;

import com.chaekdami.user.domain.AuthAttempt;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AuthAttemptRepository extends JpaRepository<AuthAttempt, Long> {

    Optional<AuthAttempt> findByAttemptKey(String attemptKey);

    /** 같은 키의 첫 요청이 겹쳐도 UNIQUE 오류가 나지 않게 행을 만든다. */
    @Modifying(flushAutomatically = true)
    @Query(value = """
            insert into auth_attempts (attempt_key, attempt_count, window_started_at)
            values (:attemptKey, 0, :now)
            on conflict do nothing
            """, nativeQuery = true)
    int insertIfAbsent(@Param("attemptKey") String attemptKey, @Param("now") LocalDateTime now);

    /** 겹친 요청의 횟수를 빠뜨리지 않도록 행을 잠근다. 트랜잭션 안에서만 부른다. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from AuthAttempt a where a.attemptKey = :attemptKey")
    Optional<AuthAttempt> findByAttemptKeyForUpdate(@Param("attemptKey") String attemptKey);

    /** 이메일의 _, %가 와일드카드로 쓰이지 않도록 LIKE 대신 앞부분을 그대로 비교한다. */
    @Modifying
    @Query("delete from AuthAttempt a where substring(a.attemptKey, 1, length(:prefix)) = :prefix")
    void deleteByKeyPrefix(@Param("prefix") String prefix);
}
