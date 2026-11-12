package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.UserQuest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserQuestRepository extends JpaRepository<UserQuest, Long> {

    /**
     * user_quests 에 날짜 컬럼이 없으므로 created_at 이 [start, end) 구간인 행을 그날의 퀘스트로 본다.
     */
    @Query("select uq from UserQuest uq join fetch uq.quest"
            + " where uq.userId = :userId and uq.createdAt >= :start and uq.createdAt < :end"
            + " order by uq.quest.id")
    List<UserQuest> findAllCreatedBetween(@Param("userId") Long userId,
                                          @Param("start") LocalDateTime start,
                                          @Param("end") LocalDateTime end);

    @Query("select uq from UserQuest uq join fetch uq.quest where uq.id = :id and uq.userId = :userId")
    Optional<UserQuest> findByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
}
