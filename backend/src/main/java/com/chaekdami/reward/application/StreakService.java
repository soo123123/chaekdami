package com.chaekdami.reward.application;

import com.chaekdami.dday.domain.DdayRecord;
import com.chaekdami.dday.domain.DdayRecordStatus;
import com.chaekdami.dday.infrastructure.DdayRecordRepository;
import com.chaekdami.reward.domain.ShopItemType;
import com.chaekdami.reward.domain.StreakCalculator;
import com.chaekdami.reward.domain.UserItem;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 연속 독서(D-day)와 방어권 자동 차감. 연속 기록의 기준은 D-day 달력(dday_records) 하나다.
 * - 읽은 날: 독서 완료 보상이 "읽음"으로 기록한다. (DdayService.markRead)
 * - 놓친 날: 마지막 기록 다음 날부터 기준일 전날까지 하루마다 방어권 1개를 자동으로 써서 "방어"로 기록한다.
 *   방어권이 떨어지면 거기서 멈추고, 빈 날 때문에 연속이 끊긴다.
 * - 연속 일수가 0이면 지킬 기록이 없으므로 방어권을 쓰지 않는다.
 * - 연속 일수는 읽은 날만 센다. 방어한 날은 끊기지 않게만 하고 +0 이다. (StreakCalculator)
 * 정산은 배치 없이, 달력/보상 상태 조회와 독서 완료 보상 때 그 자리에서 처리한다.
 */
@Service
@RequiredArgsConstructor
public class StreakService {

    private final DdayRecordRepository ddayRecordRepository;
    private final UserItemRepository userItemRepository;
    private final RewardLedger rewardLedger;

    /**
     * date 전날까지 놓친 날을 방어권으로 막는다. 정산할 날이 있을 때만 보상 계정을 잠근다.
     *
     * @return 사용한 방어권 수
     */
    @Transactional
    public int settleBefore(Long userId, LocalDate date) {
        if (lastActiveBeforeIfMissed(loadDays(userId), date) == null) {
            return 0;
        }
        rewardLedger.lockAccount(userId);
        Map<LocalDate, Boolean> days = loadDays(userId);
        LocalDate lastActive = lastActiveBeforeIfMissed(days, date);
        if (lastActive == null || StreakCalculator.streakEndingAt(days, lastActive) == 0) {
            return 0;
        }

        Iterator<UserItem> shields = userItemRepository
                .findAllInStockByUserIdAndItemType(userId, ShopItemType.SHIELD)
                .iterator();
        UserItem shield = shields.hasNext() ? shields.next() : null;
        int shieldsUsed = 0;
        for (LocalDate missed = lastActive.plusDays(1); missed.isBefore(date); missed = missed.plusDays(1)) {
            while (shield != null && shield.getQuantity() == 0) {
                shield = shields.hasNext() ? shields.next() : null;
            }
            if (shield == null) {
                break;
            }
            shield.deductQuantity(1);
            ddayRecordRepository.save(DdayRecord.create(userId, missed, DdayRecordStatus.PROTECTED));
            shieldsUsed++;
        }
        return shieldsUsed;
    }

    /**
     * today 기준 현재 연속 일수와 최고 연속 일수
     */
    @Transactional(readOnly = true)
    public StreakCalculator.Summary summarize(Long userId, LocalDate today) {
        return StreakCalculator.summarize(loadDays(userId), today);
    }

    private Map<LocalDate, Boolean> loadDays(Long userId) {
        Map<LocalDate, Boolean> days = new LinkedHashMap<>();
        for (DdayRecord record : ddayRecordRepository.findAllByUserIdOrderByRecordDateAsc(userId)) {
            days.put(record.getRecordDate(), record.getStatus() == DdayRecordStatus.READ);
        }
        return days;
    }

    /**
     * date 이전의 마지막 기록일이 date 전전날 이전이면(= 사이에 빈 날이 있으면) 그 날짜, 아니면 null
     */
    private static LocalDate lastActiveBeforeIfMissed(Map<LocalDate, Boolean> days, LocalDate date) {
        LocalDate lastActive = days.keySet().stream()
                .filter(day -> day.isBefore(date))
                .max(LocalDate::compareTo)
                .orElse(null);
        return lastActive != null && lastActive.isBefore(date.minusDays(1)) ? lastActive : null;
    }
}
