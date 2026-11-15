package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.RewardTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RewardTransactionRepository extends JpaRepository<RewardTransaction, Long> {
}
