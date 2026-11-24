package com.chaekdami.user.application;

import com.chaekdami.config.JwtTokenProvider;
import com.chaekdami.user.application.command.ChangePasswordCommand;
import com.chaekdami.user.application.command.LoginCommand;
import com.chaekdami.user.application.exception.DuplicateNicknameException;
import com.chaekdami.user.application.exception.UnauthorizedException;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.UserRepository;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 닉네임 변경 API (스펙 010). H2를 쓰므로 PostgreSQL 전용 동작은 확인하지 않는다. */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:nickname;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
@AutoConfigureMockMvc
class ChangeNicknameTest {

    private static final String EMAIL = "nickname@test.local";
    private static final String PASSWORD = "Password1";

    @Autowired
    private MockMvc mvc;
    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository users;
    @Autowired
    private JwtTokenProvider tokens;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private DataSource dataSource;
    @Autowired
    private TransactionTemplate transaction;
    @MockitoSpyBean
    private PasswordEncoder encoder;
    @MockitoBean
    private PasswordResetNotifier notifier;

    private Long userId;
    private Long otherId;
    private String accessToken;

    @BeforeEach
    void setUp() {
        jdbc.update("delete from refresh_tokens");
        jdbc.update("delete from users");
        userId = save(EMAIL, "Before");
        otherId = save("other@test.local", "Taken");
        accessToken = tokens.createAccessToken(userId, "USER", 0);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void changesTheNicknameAndKeepsTheLogin() throws Exception {
        String refreshToken = userService.login(new LoginCommand(EMAIL, PASSWORD, "127.0.0.1")).refreshToken();

        request("  새Nick1  ").andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId))
                .andExpect(jsonPath("$.email").value(EMAIL))
                .andExpect(jsonPath("$.nickname").value("새Nick1"))
                .andExpect(jsonPath("$.role").value("USER"));

        mvc.perform(get("/api/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nickname").value("새Nick1"));
        assertEquals("새nick1", column("nickname_lower"));
        assertNotNull(userService.refresh(refreshToken));
    }

    @ParameterizedTest
    @ValueSource(strings = {"Before", "BEFORE"})
    void sameNicknameAndOnlyCaseChangeSucceed(String nickname) throws Exception {
        request(nickname).andExpect(status().isOk()).andExpect(jsonPath("$.nickname").value(nickname));

        assertEquals(nickname, column("nickname"));
    }

    @Test
    void withoutLoginIs401() throws Exception {
        mvc.perform(patch("/api/me").contentType(MediaType.APPLICATION_JSON).content("{\"nickname\":\"After\"}"))
                .andExpect(status().isUnauthorized());

        assertEquals("Before", column("nickname"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"nickname\":null}", "{\"nickname\":\"  \"}", "{\"nickname\":\" a \"}",
            "{\"nickname\":\"12345678901234567\"}", "{\"nickname\":\"a b\"}", "{\"nickname\":\"nick!\"}",
            "{\"nickname\":\"Password1\"}"})
    void invalidNicknameIs400(String body) throws Exception {
        mvc.perform(patch("/api/me").header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        assertEquals("Before", column("nickname"));
    }

    @Test
    void nicknameOfAnotherUserIs409IgnoringCase() throws Exception {
        request("tAKEN").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("NICKNAME_ALREADY_EXISTS"));

        assertEquals("Before", column("nickname"));
    }

    @Test
    void onlyOneOfTwoConcurrentChangesToTheSameNicknameSucceeds() throws Exception {
        try (var pool = Executors.newSingleThreadExecutor()) {
            Future<?> late = transaction.execute(status -> {
                jdbc.update("update users set nickname = 'Same', nickname_lower = 'same' where id = ?", otherId);
                Future<?> future = pool.submit(() -> asUser(() -> userService.changeNickname("same")));
                // 먼저 저장한 트랜잭션이 끝나기를 기다린다.
                assertThrows(TimeoutException.class, () -> future.get(1, TimeUnit.SECONDS));
                return future;
            });
            ExecutionException failure = assertThrows(ExecutionException.class, () -> late.get(15, TimeUnit.SECONDS));
            assertInstanceOf(DuplicateNicknameException.class, failure.getCause());
        }
        assertEquals("Before", column("nickname"));
    }

    @Test
    void passwordComparisonHoldsNoConnection() throws Exception {
        whileComparing(() -> assertEquals(0,
                ((HikariDataSource) dataSource).getHikariPoolMXBean().getActiveConnections()));

        request("After").andExpect(status().isOk());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "update users set password_hash = 'changed' where id = ?",
            "update users set status = 'SUSPENDED' where id = ?",
            "delete from users where id = ?"})
    void accountChangedWhileComparingIs401(String sql) throws Exception {
        whileComparing(() -> jdbc.update(sql, userId));

        request("After").andExpect(status().isUnauthorized());

        assertEquals(0, jdbc.queryForObject("select count(*) from users where nickname = 'After'", Integer.class));
    }

    @Test
    void passwordChangeThatStartedEarlierKeepsTheNewNickname() {
        String oldHash = column("password_hash");
        try (var pool = Executors.newSingleThreadExecutor()) {
            whileComparing(() -> pool.submit(() -> asUser(() -> userService.changeNickname("After")))
                    .get(10, TimeUnit.SECONDS));

            asUser(() -> userService.changePassword(new ChangePasswordCommand(PASSWORD, "Password2")));
        }

        assertEquals("After", column("nickname"));
        assertEquals("after", column("nickname_lower"));
        assertNotEquals(oldHash, column("password_hash"));
        assertEquals(1, jdbc.queryForObject("select token_version from users where id = ?", Integer.class, userId));
    }

    @Test
    void deletedUserIs401() {
        jdbc.update("delete from users where id = ?", userId);

        assertThrows(UnauthorizedException.class, () -> asUser(() -> userService.changeNickname("After")));
    }

    private interface Action {
        void run() throws Exception;
    }

    /** 첫 비밀번호 비교 도중에 한 번 실행한다. */
    private void whileComparing(Action action) {
        AtomicBoolean done = new AtomicBoolean();
        doAnswer(invocation -> {
            if (done.compareAndSet(false, true)) {
                action.run();
            }
            return invocation.callRealMethod();
        }).when(encoder).matches(any(), anyString());
    }

    private void asUser(Runnable action) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null, List.of()));
        try {
            action.run();
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private ResultActions request(String nickname) throws Exception {
        return mvc.perform(patch("/api/me").header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON).content("{\"nickname\":\"" + nickname + "\"}"));
    }

    private Long save(String email, String nickname) {
        return users.save(User.builder().email(email).passwordHash(encoder.encode(PASSWORD))
                .nickname(nickname).role(Role.USER).build()).getId();
    }

    private String column(String name) {
        return jdbc.queryForObject("select " + name + " from users where id = ?", String.class, userId);
    }
}
