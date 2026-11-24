package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.UserBuff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserBuffRepository extends JpaRepository<UserBuff, Long> {

    /**
     * 남은 시간이 있는 부스터를 켠 순서로 조회한다. 남은 시간을 줄일 때는 보상 계정을 먼저 잠근다.
     */
    @Query("select ub from UserBuff ub"
            + " where ub.userId = :userId and ub.buffActivated = true and ub.remainingSeconds > 0"
            + " order by ub.buffStartAt asc, ub.id asc")
    List<UserBuff> findRemainingBuffs(@Param("userId") Long userId);

    /**
     * 남은 부스터 시간(초) 합계. 없으면 0.
     */
    @Query("select coalesce(sum(ub.remainingSeconds), 0) from UserBuff ub"
            + " where ub.userId = :userId and ub.buffActivated = true and ub.remainingSeconds > 0")
    long sumRemainingSeconds(@Param("userId") Long userId);

    @Modifying(flushAutomatically = true)
    @Query("delete from UserBuff ub where ub.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
