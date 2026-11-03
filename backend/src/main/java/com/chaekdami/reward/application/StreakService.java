package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.RewardAccount;
import com.chaekdami.reward.domain.ShopItemType;
import com.chaekdami.reward.domain.StreakLog;
import com.chaekdami.reward.domain.UserItem;
import com.chaekdami.reward.infrastructure.StreakLogRepository;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Iterator;
import java.util.Optional;

/**
 * 연속 독서 스트릭(D-day)과 방어권 자동 차감
 * - 하루 성공 기준: 그날 독서 세션 1회 이상 완료 (갱신 기준은 자정)
 * - 자정이 지나도록 성공하지 못한 날은 방어권 1개를 자동 차감해 스트릭을 유지한다. (연속 일수는 늘지 않음)
 * - 방어권이 없으면 스트릭을 0으로 되돌린다. 스트릭이 0이면 지킬 기록이 없으므로 방어권을 쓰지 않는다.
 * 놓친 날의 정산은 배치 없이, 다음 독서 기록이나 보상 상태 조회 때 한꺼번에 처리한다.
 */
@Service
@RequiredArgsConstructor
public class StreakService {

    private final StreakLogRepository streakLogRepository;
    private final UserItemRepository userItemRepository;
    private final RewardLedger rewardLedger;

    /**
     * 오늘 독서 성공을 기록한다. 놓친 날을 먼저 정산한 뒤 오늘 기록을 남기고, 오늘 첫 성공이면 연속 일수를 늘린다.
     * 독서 완료 유스케이스(CompleteReadingService)가 세션 완료 시 호출한다.
     */
    @Transactional
    public StreakResult recordReadingDay(Long userId) {
        RewardAccount account = rewardLedger.lockAccount(userId);
        LocalDate today = LocalDate.now();
        int shieldsUsed = settleMissedDays(account, today);

        boolean newlyAchieved = !streakLogRepository.existsByUserIdAndAchievedDate(userId, today);
        if (newlyAchieved) {
            streakLogRepository.save(StreakLog.builder()
                    .userId(userId)
                    .achievedDate(today)
                    .shieldUsed(false)
                    .build());
            account.extendStreak();
        }
        return new StreakResult(account.getDday(), account.getMaxDday(), shieldsUsed, newlyAchieved);
    }

    /**
     * 정산할 놓친 날이 있을 때만 보상 계정을 잠그고 정산한다. 보상 상태 조회가 계정을 읽기 전에 호출한다.
     * 호출하는 서비스의 트랜잭션 안에서 실행된다.
     */
    void settleIfNeeded(Long userId) {
        LocalDate today = LocalDate.now();
        if (!hasMissedDays(userId, today)) {
            return;
        }
        settleMissedDays(rewardLedger.lockAccount(userId), today);
    }

    /**
     * 마지막 기록 다음 날부터 어제까지 놓친 날마다 방어권 1개를 차감하고 방어 기록을 남긴다.
     * 방어권이 떨어지면 그날 스트릭을 0으로 되돌리고 멈춘다.
     *
     * @return 차감한 방어권 수
     */
    private int settleMissedDays(RewardAccount account, LocalDate today) {
        if (account.getDday() == 0 || !hasMissedDays(account.getUserId(), today)) {
            return 0;
        }
        LocalDate missedDate = latestLogDate(account.getUserId()).orElseThrow().plusDays(1);
        Iterator<UserItem> shields = userItemRepository
                .findAllInStockByUserIdAndItemType(account.getUserId(), ShopItemType.SHIELD)
                .iterator();
        UserItem shield = shields.hasNext() ? shields.next() : null;

        int shieldsUsed = 0;
        while (missedDate.isBefore(today)) {
            while (shield != null && shield.getQuantity() == 0) {
                shield = shields.hasNext() ? shields.next() : null;
            }
            if (shield == null) {
                account.resetStreak();
                break;
            }
            shield.deductQuantity(1);
            streakLogRepository.save(StreakLog.builder()
                    .userId(account.getUserId())
                    .achievedDate(missedDate)
                    .shieldUsed(true)
                    .build());
            shieldsUsed++;
            missedDate = missedDate.plusDays(1);
        }
        return shieldsUsed;
    }

    /** 마지막 기록(성공 또는 방어)이 어제보다 이전이면 정산할 날이 있다. */
    private boolean hasMissedDays(Long userId, LocalDate today) {
        return latestLogDate(userId)
                .map(date -> date.isBefore(today.minusDays(1)))
                .orElse(false);
    }

    private Optional<LocalDate> latestLogDate(Long userId) {
        return streakLogRepository.findTopByUserIdOrderByAchievedDateDesc(userId)
                .map(StreakLog::getAchievedDate);
    }
}
