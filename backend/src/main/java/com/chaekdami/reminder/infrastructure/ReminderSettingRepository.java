package com.chaekdami.reminder.infrastructure;

import com.chaekdami.reminder.domain.ReminderSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReminderSettingRepository extends JpaRepository<ReminderSetting, Long> {

    Optional<ReminderSetting> findByUserId(Long userId);

    void deleteAllByUserId(Long userId);
}
