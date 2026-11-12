package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.StreakLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface StreakLogRepository extends JpaRepository<StreakLog, Long> {

    boolean existsByUserIdAndAchievedDate(Long userId, LocalDate achievedDate);

    Optional<StreakLog> findTopByUserIdOrderByAchievedDateDesc(Long userId);
}
