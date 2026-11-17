package com.chaekdami.dday.infrastructure;

import com.chaekdami.dday.domain.DdayGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DdayGoalRepository extends JpaRepository<DdayGoal, Long> {

    List<DdayGoal> findAllByUserIdOrderByTargetDateAscIdAsc(Long userId);
}
