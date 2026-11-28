package com.chaekdami.reminder.application;

import com.chaekdami.reminder.application.result.ReminderSettingResult;
import com.chaekdami.reminder.application.result.ReminderStatusResult;
import com.chaekdami.reminder.infrastructure.ReminderCleanupListener;
import com.chaekdami.reminder.infrastructure.ReminderSettingRepository;
import com.chaekdami.user.application.event.UserWithdrawnEvent;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 알림 설정 저장과 세션 조회 쿼리를 실제로 실행해 확인한다. (스펙 014 R4)
 * H2(메모리)를 쓰므로 팀 DB에 연결하지 않고, PostgreSQL 전용 동작은 확인하지 않는다.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:reminder;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
class ReminderDbTest {

    @Autowired
    private ReminderSettingService reminderSettingService;
    @Autowired
    private ReminderStatusService reminderStatusService;
    @Autowired
    private ReminderSettingRepository reminderSettingRepository;
    @Autowired
    private ReminderCleanupListener reminderCleanupListener;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void clear() {
        jdbc.execute("set referential_integrity false");   // 세션의 독서 기록 없이 조회만 확인한다
        jdbc.update("delete from reading_sessions");
        jdbc.update("delete from reminder_settings");
        jdbc.update("delete from users");
    }

    @Test
    void 저장한_적이_없으면_기본값을_주고_행을_만들지_않는다() {
        Long userId = user("default");

        assertThat(reminderSettingService.get(userId)).isEqualTo(new ReminderSettingResult(true, false, 300));
        assertThat(reminderSettingRepository.findByUserId(userId)).isEmpty();
    }

    @Test
    void 저장하면_다음_조회에서_같은_값이_나오고_다시_저장하면_고친다() {
        Long userId = user("saver");

        reminderSettingService.save(userId, false, true, 120);
        assertThat(reminderSettingService.get(userId)).isEqualTo(new ReminderSettingResult(false, true, 120));

        reminderSettingService.save(userId, true, false, 600);
        assertThat(reminderSettingService.get(userId)).isEqualTo(new ReminderSettingResult(true, false, 600));
        assertThat(reminderSettingRepository.count()).isEqualTo(1);
    }

    @Test
    void 주간_목표가_범위를_벗어나면_저장하지_않는다() {
        Long userId = user("range");

        assertThatThrownBy(() -> reminderSettingService.save(userId, true, false, 29))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> reminderSettingService.save(userId, true, false, 3001))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(reminderSettingRepository.findByUserId(userId)).isEmpty();
    }

    @Test
    void 탈퇴하면_그_회원의_설정만_지운다() {
        Long leaving = user("leaving");
        Long staying = user("staying");
        reminderSettingService.save(leaving, true, true, 100);
        reminderSettingService.save(staying, true, true, 100);

        reminderCleanupListener.onUserWithdrawn(new UserWithdrawnEvent(leaving));

        assertThat(reminderSettingRepository.findByUserId(leaving)).isEmpty();
        assertThat(reminderSettingRepository.findByUserId(staying)).isPresent();
    }

    @Test
    void 이번_주에_끝난_내_세션만_조회한다() {
        Long me = user("reader");
        Long other = user("other");
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        session(me, now.minusMinutes(1), 600);
        session(me, today.minusDays(14).atTime(12, 0), 900);   // 지난 주
        session(other, now.minusMinutes(1), 1200);              // 다른 사람
        reminderSettingService.save(me, true, false, 200);

        ReminderStatusResult result = reminderStatusService.get(me);

        assertThat(result.weekMinutes()).isEqualTo(10);
        assertThat(result.weekReadDates()).hasSize(1);
        assertThat(result.nickname()).isEqualTo("reader");
        assertThat(result.currentStreak()).isZero();
        assertThat(result.ownedShieldCount()).isZero();
        assertThat(result.settings().weeklyGoalMinutes()).isEqualTo(200);
    }

    private Long user(String name) {
        return userRepository.save(User.builder()
                .email(name + "@test.local").passwordHash("x").nickname(name).role(Role.USER).build()).getId();
    }

    private void session(Long userId, LocalDateTime endedAt, int seconds) {
        Timestamp time = Timestamp.valueOf(endedAt);
        jdbc.update("insert into reading_sessions (user_id, reading_record_id, started_at, ended_at, duration_seconds,"
                + " start_page, end_page, created_at) values (?, 1, ?, ?, ?, 1, 2, ?)", userId, time, time, seconds, time);
    }
}
