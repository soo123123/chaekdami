package com.chaekdami.reward.infrastructure;

import com.chaekdami.reward.domain.RewardTransaction;
import com.chaekdami.reward.domain.TransactionReason;
import com.chaekdami.reward.domain.TransactionType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RewardTransactionRepository extends JpaRepository<RewardTransaction, Long> {

    boolean existsByUserIdAndTypeAndReasonAndReferenceId(Long userId, TransactionType type,
                                                         TransactionReason reason, Long referenceId);

    @Modifying(flushAutomatically = true)
    @Query("delete from RewardTransaction rt where rt.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);

    /**
     * 기간 [start, end) 안에 받은 type 금액 합이 큰 사용자 순서. 같으면 사용자 번호 작은 순. (주간 랭킹)
     * 합이 0인 사용자, 정지 중인 회원, 관리자는 나오지 않는다.
     */
    @Query("""
            select rt.userId as userId, sum(rt.amount) as amount
            from RewardTransaction rt
            where rt.type = :type and rt.createdAt >= :start and rt.createdAt < :end
              and rt.userId in
            """ + RankingTargets.USER_IDS + """
            group by rt.userId
            having sum(rt.amount) > 0
            order by sum(rt.amount) desc, rt.userId asc
            """)
    List<UserAmount> findTopAmounts(@Param("type") TransactionType type,
                                    @Param("start") LocalDateTime start,
                                    @Param("end") LocalDateTime end,
                                    @Param("now") LocalDateTime now,
                                    Pageable pageable);

    /**
     * 한 사용자가 기간 [start, end) 안에 받은 type 금액 합. 없으면 0.
     */
    @Query("""
            select coalesce(sum(rt.amount), 0)
            from RewardTransaction rt
            where rt.userId = :userId and rt.type = :type and rt.createdAt >= :start and rt.createdAt < :end
            """)
    long sumAmount(@Param("userId") Long userId,
                   @Param("type") TransactionType type,
                   @Param("start") LocalDateTime start,
                   @Param("end") LocalDateTime end);

    /**
     * 기간 [start, end) 안에 받은 type 금액 합이 amount 보다 큰 사용자 수. 정지 중인 회원과 관리자는 세지 않는다. (동점 순위 = 이 값 + 1)
     */
    @Query("""
            select count(distinct rt.userId)
            from RewardTransaction rt
            where rt.userId in (
                select r.userId
                from RewardTransaction r
                where r.type = :type and r.createdAt >= :start and r.createdAt < :end
                  and r.userId in
            """ + RankingTargets.USER_IDS + """
                group by r.userId
                having sum(r.amount) > :amount
            )
            """)
    long countUsersWithAmountGreaterThan(@Param("type") TransactionType type,
                                         @Param("start") LocalDateTime start,
                                         @Param("end") LocalDateTime end,
                                         @Param("now") LocalDateTime now,
                                         @Param("amount") long amount);

    interface UserAmount {
        Long getUserId();

        Long getAmount();
    }
}
