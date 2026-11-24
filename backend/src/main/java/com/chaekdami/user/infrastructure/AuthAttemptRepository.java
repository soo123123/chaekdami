package com.chaekdami.user.infrastructure;

import com.chaekdami.user.domain.AuthAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AuthAttemptRepository extends JpaRepository<AuthAttempt, Long> {

    Optional<AuthAttempt> findByAttemptKey(String attemptKey);

    /** 이메일의 _, %가 와일드카드로 쓰이지 않도록 LIKE 대신 앞부분을 그대로 비교한다. */
    @Modifying
    @Query("delete from AuthAttempt a where substring(a.attemptKey, 1, length(:prefix)) = :prefix")
    void deleteByKeyPrefix(@Param("prefix") String prefix);
}
