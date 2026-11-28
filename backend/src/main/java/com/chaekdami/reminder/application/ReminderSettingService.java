package com.chaekdami.reminder.application;

import com.chaekdami.reminder.application.result.ReminderSettingResult;
import com.chaekdami.reminder.domain.ReminderSetting;
import com.chaekdami.reminder.infrastructure.ReminderSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionOperations;

/**
 * 독서 알림 설정 조회·저장. (스펙 014 R4.5~R4.8)
 */
@Service
@RequiredArgsConstructor
public class ReminderSettingService {

    private final ReminderSettingRepository reminderSettingRepository;
    private final TransactionOperations transaction;

    /**
     * 저장한 적이 없으면 저장하지 않고 기본값을 돌려준다 (R4.6)
     */
    @Transactional(readOnly = true)
    public ReminderSettingResult get(Long userId) {
        return reminderSettingRepository.findByUserId(userId)
                .map(ReminderSettingResult::from)
                .orElseGet(ReminderSettingResult::defaults);
    }

    /**
     * 처음 저장이 동시에 일어나 UNIQUE 에 걸리면 이미 만들어진 행을 다시 읽어 고친다
     */
    public ReminderSettingResult save(Long userId, boolean enabled, boolean earlyLateMuted, int weeklyGoalMinutes) {
        try {
            return transaction.execute(status -> upsert(userId, enabled, earlyLateMuted, weeklyGoalMinutes));
        } catch (DataIntegrityViolationException firstInsertRace) {
            return transaction.execute(status -> upsert(userId, enabled, earlyLateMuted, weeklyGoalMinutes));
        }
    }

    @Transactional
    public void deleteAllOfUser(Long userId) {
        reminderSettingRepository.deleteAllByUserId(userId);
    }

    private ReminderSettingResult upsert(Long userId, boolean enabled, boolean earlyLateMuted, int weeklyGoalMinutes) {
        ReminderSetting setting = reminderSettingRepository.findByUserId(userId)
                .map(found -> {
                    found.change(enabled, earlyLateMuted, weeklyGoalMinutes);
                    return found;
                })
                .orElseGet(() -> ReminderSetting.create(userId, enabled, earlyLateMuted, weeklyGoalMinutes));
        return ReminderSettingResult.from(reminderSettingRepository.saveAndFlush(setting));
    }
}
