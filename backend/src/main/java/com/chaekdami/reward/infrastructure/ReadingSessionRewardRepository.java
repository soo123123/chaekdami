package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.ReadingSessionReward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ReadingSessionRewardRepository extends JpaRepository<ReadingSessionReward, Long> {

    Optional<ReadingSessionReward> findByUserIdAndReadingSessionId(Long userId, Long readingSessionId);

    /**
     * 완료 퀘스트 목록(reading_session_reward_quests)은 JPQL 일괄 삭제로 지워지지 않아서 먼저 지운다.
     * deleteAllByUserId 보다 먼저 호출해야 한다.
     */
    @Modifying(flushAutomatically = true)
    @Query(value = "delete from reading_session_reward_quests where reading_session_reward_id in"
            + " (select id from reading_session_rewards where user_id = :userId)", nativeQuery = true)
    int deleteAllQuestsByUserId(@Param("userId") Long userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from ReadingSessionReward r where r.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
