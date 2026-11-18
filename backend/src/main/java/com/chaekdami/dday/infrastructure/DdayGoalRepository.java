package com.chaekdami.dday.infrastructure;

import com.chaekdami.dday.domain.DdayGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DdayGoalRepository extends JpaRepository<DdayGoal, Long> {

    List<DdayGoal> findAllByUserIdOrderByTargetDateAscIdAsc(Long userId);

    @Modifying(flushAutomatically = true)
    @Query("delete from DdayGoal g where g.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
