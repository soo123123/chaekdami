package com.chaekdami.user.application;

import com.chaekdami.user.application.exception.InvalidRequestException;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** 탈퇴하면 그 이메일의 로그인·재설정 제한 기록만 지워지는지 확인한다 (ISSUE-DATA-5). */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:withdraw;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
class WithdrawAuthAttemptsTest {

    private static final String PASSWORD = "Password1!";
    private static final String EMAIL = "a_b%c@test.local";
    private static final List<String> MINE = List.of(
            "login|a_b%c@test.local|10.0.0.1", "login|a_b%c@test.local|::1",
            "reset|a_b%c@test.local|10.0.0.1", "reset|a_b%c@test.local|*");
    private static final List<String> OTHERS = List.of(
            "login|axbyc@test.local|10.0.0.1", "reset|axbyc@test.local|10.0.0.1",
            "reset|axbyc@test.local|*",
            "login|a_b%c@test.local.kr|10.0.0.1", "login|xa_b%c@test.local|10.0.0.1");

    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository users;
    @Autowired
    private LoginAttemptLimiter limiter;
    @Autowired
    private PasswordEncoder encoder;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private TransactionTemplate transaction;
    @MockitoBean
    private PasswordResetNotifier notifier;

    private Long userId;

    @BeforeEach
    void setUp() {
        jdbc.update("delete from auth_attempts");
        jdbc.update("delete from users");
        userId = users.save(User.builder().email(EMAIL).passwordHash(encoder.encode(PASSWORD))
                .nickname("withdraw").role(Role.USER).build()).getId();
        limiter.recordLoginFailure(EMAIL, "10.0.0.1");
        limiter.recordLoginFailure(EMAIL, "::1");
        limiter.consumePasswordResetRequest(EMAIL, "10.0.0.1");
        limiter.recordLoginFailure("axbyc@test.local", "10.0.0.1");
        limiter.consumePasswordResetRequest("axbyc@test.local", "10.0.0.1");
        limiter.recordLoginFailure("a_b%c@test.local.kr", "10.0.0.1");
        limiter.recordLoginFailure("xa_b%c@test.local", "10.0.0.1");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null, List.of()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void withdrawDeletesOnlyTheRecordsOfThatEmailFromEveryIp() {
        userService.withdraw(PASSWORD);

        assertFalse(users.existsById(userId));
        assertEquals(sorted(OTHERS), keys());
    }

    @Test
    void wrongPasswordKeepsTheRecords() {
        assertThrows(InvalidRequestException.class, () -> userService.withdraw("wrong"));

        assertEverythingKept();
    }

    @Test
    void recordsComeBackWhenTheWithdrawalRollsBack() {
        transaction.executeWithoutResult(status -> {
            userService.withdraw(PASSWORD);
            users.flush();
            assertEquals(sorted(OTHERS), keys());
            status.setRollbackOnly();
        });

        assertEverythingKept();
    }

    private void assertEverythingKept() {
        assertTrue(users.existsById(userId));
        assertEquals(sorted(Stream.concat(MINE.stream(), OTHERS.stream()).toList()), keys());
    }

    private List<String> keys() {
        return sorted(jdbc.queryForList("select attempt_key from auth_attempts", String.class));
    }

    private static List<String> sorted(List<String> keys) {
        return keys.stream().sorted().toList();
    }
}
