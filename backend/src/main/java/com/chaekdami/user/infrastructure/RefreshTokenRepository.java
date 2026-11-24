package com.chaekdami.user.infrastructure;

import com.chaekdami.user.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Query("select t.user.id from RefreshToken t where t.tokenHash = :tokenHash")
    Optional<Long> findUserIdByTokenHash(@Param("tokenHash") String tokenHash);

    /** 재발급으로 교체된 토큰은 재사용 감지에 필요하므로 남긴다. */
    @Modifying
    @Query("delete from RefreshToken t where t.tokenHash = :tokenHash and t.revokedAt is null")
    void deleteUsableByTokenHash(@Param("tokenHash") String tokenHash);

    @Modifying
    @Query("delete from RefreshToken t where t.user.id = :userId")
    void deleteAllOfUser(@Param("userId") Long userId);
}
