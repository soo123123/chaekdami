package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.Quest;
import com.chaekdami.reward.domain.QuestType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestRepository extends JpaRepository<Quest, Long> {

    List<Quest> findAllByTypeOrderByIdAsc(QuestType type);
}
