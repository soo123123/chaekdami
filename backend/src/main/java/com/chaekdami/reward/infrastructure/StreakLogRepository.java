package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.StreakLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface StreakLogRepository extends JpaRepository<StreakLog, Long> {

    boolean existsByUserIdAndAchievedDate(Long userId, LocalDate achievedDate);

    Optional<StreakLog> findTopByUserIdOrderByAchievedDateDesc(Long userId);

    @Modifying(flushAutomatically = true)
    @Query("delete from StreakLog sl where sl.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
