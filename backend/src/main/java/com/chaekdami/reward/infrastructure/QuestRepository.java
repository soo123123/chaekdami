package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.Quest;
import com.chaekdami.reward.domain.QuestType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuestRepository extends JpaRepository<Quest, Long> {

    List<Quest> findAllByTypeOrderByIdAsc(QuestType type);

    Optional<Quest> findByCode(String code);

    /** code 컬럼이 생기기 전에 만들어진 행을 제목으로 찾는다. */
    Optional<Quest> findFirstByCodeIsNullAndTitleOrderByIdAsc(String title);
}
