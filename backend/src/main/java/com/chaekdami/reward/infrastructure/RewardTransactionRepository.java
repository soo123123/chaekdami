package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.RewardTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RewardTransactionRepository extends JpaRepository<RewardTransaction, Long> {

    @Modifying(flushAutomatically = true)
    @Query("delete from RewardTransaction rt where rt.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
