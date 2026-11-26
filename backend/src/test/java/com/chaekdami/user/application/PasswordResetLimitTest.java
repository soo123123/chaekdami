package com.chaekdami.user.application;

import com.chaekdami.user.application.command.LoginCommand;
import com.chaekdami.user.application.command.PasswordResetCommand;
import com.chaekdami.user.application.command.PasswordResetRequestCommand;
import com.chaekdami.user.application.exception.TooManyAttemptsException;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 이메일별 비밀번호 재설정 요청 제한 (스펙 011). */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:resetlimit;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
@AutoConfigureMockMvc
class PasswordResetLimitTest {

    private static final String EMAIL = "limit@test.local";
    private static final String PASSWORD = "Password1";

    @Autowired
    private MockMvc mvc;
    @Autowired
    private UserService userService;
    @Autowired
    private LoginAttemptLimiter limiter;
    @Autowired
    private UserRepository users;
    @Autowired
    private PasswordEncoder encoder;
    @Autowired
    private JdbcTemplate jdbc;
    @MockitoBean
    private PasswordResetNotifier notifier;

    @BeforeEach
    void setUp() {
        jdbc.update("delete from auth_attempts");
        jdbc.update("delete from password_reset_tokens");
        jdbc.update("delete from refresh_tokens");
        jdbc.update("delete from users");
        users.save(User.builder().email(EMAIL).passwordHash(encoder.encode(PASSWORD))
                .nickname("limit").role(Role.USER).build());
    }

    @ParameterizedTest
    @ValueSource(strings = {EMAIL, "nobody@test.local"})
    void eleventhRequestOfAnEmailIsRejectedFromAnyIp(String email) throws Exception {
        for (int i = 1; i <= 10; i++) {
            request(email, "10.0.0." + i, 204);
        }
        mvc.perform(post("/api/auth/password/reset-request").with(r -> {
                            r.setRemoteAddr("10.0.0.11");
                            return r;
                        })
                        .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("TOO_MANY_ATTEMPTS"));

        verify(notifier, times(email.equals(EMAIL) ? 10 : 0)).send(any(), any());
        assertEquals(10, count(email, "*"));
        assertEquals(0, jdbc.queryForObject("select count(*) from auth_attempts where attempt_key = ?",
                Integer.class, "reset|" + email + "|10.0.0.11"));
    }

    @Test
    void sameIpIsStillLimitedToFiveAndRejectionsDoNotCountForTheEmail() throws Exception {
        for (int i = 0; i < 5; i++) {
            request(EMAIL, "10.0.0.1", 204);
        }
        for (int i = 0; i < 3; i++) {
            request(EMAIL, "10.0.0.1", 429);
        }

        assertEquals(5, count(EMAIL, "*"));
        request(EMAIL, "10.0.0.2", 204);
    }

    @Test
    void allowedAgainAfterTheLockEnds() throws Exception {
        lockEmail();
        request(EMAIL, "10.0.1.1", 429);
        jdbc.update("update auth_attempts set locked_until = dateadd('second', -1, localtimestamp) "
                + "where attempt_key = ?", "reset|" + EMAIL + "|*");

        request(EMAIL, "10.0.1.1", 204);

        assertEquals(1, count(EMAIL, "*"));
    }

    @Test
    void lockLastsAboutAnHour() {
        lockEmail();

        assertEquals(1, jdbc.queryForObject("select count(*) from auth_attempts where attempt_key = ? "
                + "and locked_until > dateadd('minute', 59, localtimestamp) "
                + "and locked_until <= dateadd('minute', 60, localtimestamp)", Integer.class, "reset|" + EMAIL + "|*"));
    }

    @Test
    void loginAndAnAlreadySentLinkStillWork() {
        userService.requestPasswordReset(new PasswordResetRequestCommand(EMAIL, "10.0.2.1"));
        ArgumentCaptor<String> token = ArgumentCaptor.forClass(String.class);
        verify(notifier).send(any(), token.capture());
        for (int i = 0; i < 9; i++) {
            limiter.consumePasswordResetRequest(EMAIL, "10.0.0." + i);
        }
        assertThrows(TooManyAttemptsException.class, () -> limiter.consumePasswordResetRequest(EMAIL, "10.0.2.2"));

        assertNotNull(userService.login(new LoginCommand(EMAIL, PASSWORD, "10.0.2.1")));
        userService.resetPassword(new PasswordResetCommand(token.getValue(), "Password2"));
        assertNotNull(userService.login(new LoginCommand(EMAIL, "Password2", "10.0.2.1")));
    }

    @Test
    void otherEmailsAreNotAffected() {
        lockEmail();

        assertDoesNotThrow(() -> limiter.consumePasswordResetRequest("other@test.local", "10.0.0.1"));
    }

    @Test
    void concurrentRequestsNeverExceedTheLimit() throws Exception {
        List<Callable<Boolean>> calls = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            String ip = "10.0.3." + i;
            calls.add(() -> {
                try {
                    limiter.consumePasswordResetRequest(EMAIL, ip);
                    return true;
                } catch (TooManyAttemptsException exception) {
                    return false;
                }
            });
        }
        int allowed = 0;
        try (var pool = Executors.newFixedThreadPool(5)) {
            for (Future<Boolean> result : pool.invokeAll(calls)) {
                allowed += result.get() ? 1 : 0;
            }
        }
        assertEquals(10, allowed);
    }

    private void lockEmail() {
        for (int i = 0; i < 10; i++) {
            limiter.consumePasswordResetRequest(EMAIL, "10.0.0." + i);
        }
    }

    private void request(String email, String ip, int expected) throws Exception {
        mvc.perform(post("/api/auth/password/reset-request").with(r -> {
                    r.setRemoteAddr(ip);
                    return r;
                })
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().is(expected));
    }

    private int count(String email, String ip) {
        return jdbc.queryForObject("select attempt_count from auth_attempts where attempt_key = ?",
                Integer.class, "reset|" + email + "|" + ip);
    }
}
