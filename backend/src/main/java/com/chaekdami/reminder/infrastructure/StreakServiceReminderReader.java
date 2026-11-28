package com.chaekdami.reminder.infrastructure;

import com.chaekdami.reminder.application.port.ReminderStreakReader;
import com.chaekdami.reward.application.StreakService;
import com.chaekdami.reward.domain.ShopItemType;
import com.chaekdami.reward.infrastructure.UserItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * BE2 의 연속 독서 처리와 방어권 수를 그대로 쓴다. (BE2 코드는 수정하지 않는다)
 */
@Component
@RequiredArgsConstructor
public class StreakServiceReminderReader implements ReminderStreakReader {

    private final StreakService streakService;
    private final UserItemRepository userItemRepository;

    @Override
    public Streak settleAndRead(Long userId, LocalDate today) {
        streakService.settleBefore(userId, today);
        int currentStreak = streakService.summarize(userId, today).currentStreak();
        int shields = userItemRepository.sumQuantityByUserIdAndItemType(userId, ShopItemType.SHIELD);
        return new Streak(currentStreak, shields);
    }
}
