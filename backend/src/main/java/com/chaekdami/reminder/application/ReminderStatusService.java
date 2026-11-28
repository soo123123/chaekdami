package com.chaekdami.reminder.application;

import com.chaekdami.reminder.application.port.ReminderReadingReader;
import com.chaekdami.reminder.application.port.ReminderStreakReader;
import com.chaekdami.reminder.application.port.ReminderUserReader;
import com.chaekdami.reminder.application.result.ReminderStatusResult;
import com.chaekdami.reminder.domain.ReminderWeek;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.TreeSet;

/**
 * 앱이 알림을 예약할 때 쓰는 상태 조회. 독서 값은 저장하지 않고 세션에서 계산한다. (스펙 014 R4.1~R4.4)
 */
@Service
@RequiredArgsConstructor
public class ReminderStatusService {

    private final ReminderClock reminderClock;
    private final ReminderReadingReader reminderReadingReader;
    private final ReminderStreakReader reminderStreakReader;
    private final ReminderUserReader reminderUserReader;
    private final ReminderSettingService reminderSettingService;

    /**
     * 연속 일수를 읽기 전에 놓친 날을 방어권으로 처리하므로 쓰기 트랜잭션이다 (R4.2)
     */
    @Transactional
    public ReminderStatusResult get(Long userId) {
        ReminderWeek week = ReminderWeek.containing(reminderClock.now());
        ZoneId serverZone = reminderClock.serverZone();

        long todaySeconds = 0;
        long weekSeconds = 0;
        TreeSet<LocalDate> readDates = new TreeSet<>();
        List<ReminderReadingReader.EndedSession> sessions = reminderReadingReader.findEndedBetween(
                userId, week.weekStartAt(serverZone), week.weekEndAt(serverZone));
        for (ReminderReadingReader.EndedSession session : sessions) {
            LocalDate date = ReminderWeek.koreanDateOf(session.endedAt(), serverZone);
            weekSeconds += session.durationSeconds();
            readDates.add(date);
            if (date.equals(week.today())) {
                todaySeconds += session.durationSeconds();
            }
        }

        ReminderStreakReader.Streak streak = reminderStreakReader.settleAndRead(userId, week.today());
        return new ReminderStatusResult(
                week.today(),
                week.weekStart(),
                readDates.contains(week.today()),
                List.copyOf(readDates),
                (int) (todaySeconds / 60),
                (int) (weekSeconds / 60),
                streak.currentStreak(),
                streak.ownedShieldCount(),
                reminderUserReader.nicknameOf(userId),
                reminderSettingService.get(userId));
    }
}
