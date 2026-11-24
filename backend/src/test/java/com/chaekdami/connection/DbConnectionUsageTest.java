package com.chaekdami.connection;

import com.chaekdami.config.JwtTokenProvider;
import com.chaekdami.reading.domain.Book;
import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.infrastructure.BookRepository;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.reading.infrastructure.ai.PageExtraction;
import com.chaekdami.reading.infrastructure.ai.PageTextExtractor;
import com.chaekdami.user.application.PasswordResetNotifier;
import com.chaekdami.user.application.UserService;
import com.chaekdami.user.application.command.LoginCommand;
import com.chaekdami.user.application.command.PasswordResetRequestCommand;
import com.chaekdami.user.application.exception.InvalidCredentialsException;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.UserRepository;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailSendException;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import javax.sql.DataSource;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 연결이 1개뿐인 풀에서 요청이 연결을 2개 쓰거나 외부 작업을 기다리는 동안 쥐지 않는지 확인한다 (ISSUE-BUG-8).
 * H2를 쓰므로 PostgreSQL 전용 동작은 확인하지 않는다.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:connection;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "spring.datasource.hikari.maximum-pool-size=1",
        "spring.datasource.hikari.connection-timeout=1000",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
@AutoConfigureMockMvc
class DbConnectionUsageTest {

    private static final String PASSWORD = "Password1!";

    @Autowired
    private MockMvc mvc;
    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository users;
    @Autowired
    private BookRepository books;
    @Autowired
    private ReadingRecordRepository records;
    @Autowired
    private JwtTokenProvider tokens;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private DataSource dataSource;
    @MockitoSpyBean
    private PasswordEncoder encoder;
    @MockitoBean
    private PasswordResetNotifier notifier;
    @MockitoBean
    private PageTextExtractor extractor;

    private String email;
    private Long userId;
    private Long recordId;

    @BeforeEach
    void setUp() {
        String id = UUID.randomUUID().toString().substring(0, 8);
        email = id + "@test.local";
        userId = users.save(User.builder().email(email).passwordHash(encoder.encode(PASSWORD))
                .nickname(id).role(Role.USER).build()).getId();
        Book book = books.save(new Book(userId, null, "책", "저자", null, null, null, null, null, 300));
        recordId = records.save(ReadingRecord.start(book, 1)).getId();
    }

    @Test
    void loginSucceedsWithOneConnection() throws Exception {
        login(PASSWORD).andExpect(status().isOk());
    }

    @Test
    void passwordComparisonHoldsNoConnection() throws Exception {
        doAnswer(invocation -> {
            assertNoConnectionInUse();
            return invocation.callRealMethod();
        }).when(encoder).matches(any(), anyString());

        login(PASSWORD).andExpect(status().isOk());
    }

    @Test
    void rejectedLoginsStillCountAndLock() throws Exception {
        for (int i = 0; i < 4; i++) {
            login("wrong").andExpect(status().isUnauthorized());
        }
        login("wrong").andExpect(status().isTooManyRequests());
        login(PASSWORD).andExpect(status().isTooManyRequests());
    }

    @Test
    void threeLoginsAtOnceAllSucceed() throws Exception {
        try (var pool = Executors.newFixedThreadPool(3)) {
            Callable<Integer> call = () -> login(PASSWORD).andReturn().getResponse().getStatus();
            for (Future<Integer> result : pool.invokeAll(List.of(call, call, call))) {
                assertEquals(200, result.get());
            }
        }
    }

    @Test
    void passwordChangedWhileComparingIsRejected() {
        doAnswer(invocation -> {
            Object matched = invocation.callRealMethod();
            jdbc.update("update users set password_hash = 'changed' where id = ?", userId);
            return matched;
        }).when(encoder).matches(any(), anyString());

        assertThrows(InvalidCredentialsException.class,
                () -> userService.login(new LoginCommand(email, PASSWORD, "127.0.0.1")));
        assertEquals(0, count("select count(*) from refresh_tokens where user_id = ?", userId));
    }

    @Test
    void suspendedWhileComparingIsRejected() throws Exception {
        doAnswer(invocation -> {
            Object matched = invocation.callRealMethod();
            jdbc.update("update users set status = 'SUSPENDED' where id = ?", userId);
            return matched;
        }).when(encoder).matches(any(), anyString());

        login(PASSWORD).andExpect(status().isForbidden());
        assertEquals(0, count("select count(*) from refresh_tokens where user_id = ?", userId));
    }

    @Test
    void mailHoldsNoConnectionAndReplacesTheOlderLink() throws Exception {
        requestReset().andExpect(status().isNoContent());
        doAnswer(invocation -> {
            assertNoConnectionInUse();
            return null;
        }).when(notifier).send(any(), any());

        requestReset().andExpect(status().isNoContent());

        assertEquals(1, unusedResetTokens());
    }

    @Test
    void mailFailureKeepsTheOlderLinkAndDropsTheNewOne() throws Exception {
        requestReset().andExpect(status().isNoContent());
        Long older = jdbc.queryForObject("select id from password_reset_tokens where user_id = ?", Long.class, userId);
        doThrow(new MailSendException("smtp")).when(notifier).send(any(), any());

        assertThrows(MailSendException.class,
                () -> userService.requestPasswordReset(new PasswordResetRequestCommand(email, "127.0.0.1")));

        assertEquals(1, count("select count(*) from password_reset_tokens where user_id = ?", userId));
        assertEquals(older, jdbc.queryForObject(
                "select id from password_reset_tokens where user_id = ? and used_at is null", Long.class, userId));
    }

    @Test
    void overlappingResetRequestsLeaveTheLatestLinkUsable() throws Exception {
        doAnswer(invocation -> {
            doAnswer(second -> null).when(notifier).send(any(), any());
            requestReset().andExpect(status().isNoContent());
            return null;
        }).when(notifier).send(any(), any());

        requestReset().andExpect(status().isNoContent());

        assertEquals(1, unusedResetTokens());
        assertNotNull(jdbc.queryForObject("select id from password_reset_tokens where user_id = ? and used_at is null "
                + "and id = (select max(id) from password_reset_tokens where user_id = ?)", Long.class, userId, userId));
    }

    @Test
    void certificationHoldsNoConnectionWhileWaitingForAi() throws Exception {
        when(extractor.extract(any(), any())).thenAnswer(invocation -> {
            assertNoConnectionInUse();
            return new PageExtraction("글자", null, true);
        });

        certify().andExpect(status().isCreated());
    }

    @Test
    void recordDeletedWhileWaitingForAiIsNotFound() throws Exception {
        when(extractor.extract(any(), any())).thenAnswer(invocation -> {
            jdbc.update("delete from reading_records where id = ?", recordId);
            return new PageExtraction("글자", null, true);
        });

        certify().andExpect(status().isNotFound());
        assertEquals(0, count("select count(*) from certifications where user_id = ?", userId));
    }

    private ResultActions login(String password) throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"));
    }

    private ResultActions requestReset() throws Exception {
        return mvc.perform(post("/api/auth/password/reset-request").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\"}"));
    }

    private ResultActions certify() throws Exception {
        return mvc.perform(multipart("/api/reading-records/" + recordId + "/certifications")
                .file(new MockMultipartFile("image", "page.jpg", "image/jpeg", new byte[]{1}))
                .header("Authorization", "Bearer " + tokens.createAccessToken(userId, "USER", 0)));
    }

    private void assertNoConnectionInUse() {
        assertEquals(0, ((HikariDataSource) dataSource).getHikariPoolMXBean().getActiveConnections());
    }

    private int unusedResetTokens() {
        return count("select count(*) from password_reset_tokens where user_id = ? and used_at is null", userId);
    }

    private int count(String sql, Object... args) {
        Integer result = jdbc.queryForObject(sql, Integer.class, args);
        return result == null ? 0 : result;
    }
}
