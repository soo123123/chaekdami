package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.RewardTransaction;
import com.chaekdami.reward.domain.TransactionReason;
import com.chaekdami.reward.domain.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RewardTransactionRepository extends JpaRepository<RewardTransaction, Long> {

    boolean existsByUserIdAndTypeAndReasonAndReferenceId(Long userId, TransactionType type,
                                                         TransactionReason reason, Long referenceId);

    @Modifying(flushAutomatically = true)
    @Query("delete from RewardTransaction rt where rt.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
