package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.Quest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestRepository extends JpaRepository<Quest, Long> {
}
