package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.UserBuff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface UserBuffRepository extends JpaRepository<UserBuff, Long> {

    /**
     * now 시점에 적용 중인 버프를 종료 시각이 늦은 순으로 조회한다. (UserBuff.isBuffActive 와 같은 조건)
     * 보상 상태 조회의 버프 만료 시각은 첫 번째 행의 buffEndAt 이다.
     */
    @Query("select ub from UserBuff ub"
            + " where ub.userId = :userId and ub.buffActivated = true"
            + " and ub.buffStartAt <= :now and ub.buffEndAt > :now"
            + " order by ub.buffEndAt desc")
    List<UserBuff> findActiveBuffs(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
