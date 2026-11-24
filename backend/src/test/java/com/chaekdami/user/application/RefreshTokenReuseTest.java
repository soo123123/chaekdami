package com.chaekdami.user.application;

import com.chaekdami.user.application.command.ChangePasswordCommand;
import com.chaekdami.user.application.command.LoginCommand;
import com.chaekdami.user.application.exception.UnauthorizedException;
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
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** 옛 Refresh Token이 새 로그인을 풀지 않고, 교체된 토큰의 재사용은 계속 감지하는지 확인한다 (ISSUE-BUG-25). */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:reuse;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
class RefreshTokenReuseTest {

    private static final String EMAIL = "reuse@test.local";
    private static final String PASSWORD = "Password1!";
    private static final String NEW_PASSWORD = "Password2!";

    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository users;
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
        jdbc.update("delete from refresh_tokens");
        jdbc.update("delete from users");
        userId = users.save(User.builder().email(EMAIL).passwordHash(encoder.encode(PASSWORD))
                .nickname("reuse").role(Role.USER).build()).getId();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null, List.of()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void tokenOfAnotherDeviceDoesNotEndTheLoginAfterAPasswordChange() {
        String tablet = login(PASSWORD);
        userService.changePassword(new ChangePasswordCommand(PASSWORD, NEW_PASSWORD));
        String phone = login(NEW_PASSWORD);

        assertRejectedWithoutSideEffect(tablet);
        assertNotNull(userService.refresh(phone));
    }

    @Test
    void loggedOutTokenOnlyGets401() {
        String old = login(PASSWORD);
        String other = login(PASSWORD);
        userService.logout(old);

        assertRejectedWithoutSideEffect(old);
        assertNotNull(userService.refresh(other));
    }

    @Test
    void tokensFromBeforeLogoutAllOnlyGet401EvenIfTheyWereRotated() {
        String rotated = login(PASSWORD);
        String current = userService.refresh(rotated).refreshToken();
        userService.logoutAll();
        String fresh = login(PASSWORD);

        assertRejectedWithoutSideEffect(rotated);
        assertRejectedWithoutSideEffect(current);
        assertNotNull(userService.refresh(fresh));
    }

    @Test
    void reusingARotatedTokenEndsEverySessionOnce() {
        String stolen = login(PASSWORD);
        String rotated = userService.refresh(stolen).refreshToken();
        String other = login(PASSWORD);
        long before = version();

        assertThrows(UnauthorizedException.class, () -> userService.refresh(stolen));

        assertEquals(before + 1, version());
        assertEquals(0, tokenCount());
        assertRejectedWithoutSideEffect(rotated);
        assertRejectedWithoutSideEffect(other);

        String fresh = login(PASSWORD);
        assertRejectedWithoutSideEffect(stolen);
        assertNotNull(userService.refresh(fresh));
    }

    @Test
    void loggingOutWithARotatedTokenKeepsReuseDetection() {
        String rotated = login(PASSWORD);
        userService.refresh(rotated);
        userService.logout(rotated);
        long before = version();

        assertThrows(UnauthorizedException.class, () -> userService.refresh(rotated));

        assertEquals(before + 1, version());
        assertEquals(0, tokenCount());
    }

    @Test
    void refreshWaitingForLogoutAllIsRejectedWith401() throws Exception {
        String token = login(PASSWORD);
        try (var pool = Executors.newSingleThreadExecutor()) {
            Future<?> refresh = transaction.execute(status -> {
                userService.logoutAll();
                return startAndWaitUntilBlocked(pool.submit(() -> userService.refresh(token)));
            });
            ExecutionException failure = assertThrows(ExecutionException.class, () -> refresh.get(10, TimeUnit.SECONDS));
            assertInstanceOf(UnauthorizedException.class, failure.getCause());
        }
        assertEquals(0, tokenCount());
    }

    @Test
    void logoutAllWaitingForRefreshRemovesTheNewTokenToo() throws Exception {
        String token = login(PASSWORD);
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        try (var pool = Executors.newSingleThreadExecutor()) {
            Future<?> logoutAll = transaction.execute(status -> {
                userService.refresh(token);
                return startAndWaitUntilBlocked(pool.submit(() -> {
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    userService.logoutAll();
                }));
            });
            logoutAll.get(10, TimeUnit.SECONDS);
        }
        assertEquals(0, tokenCount());
    }

    @Test
    void refreshWaitingForLogoutIsRejectedWith401() throws Exception {
        String token = login(PASSWORD);
        try (var pool = Executors.newSingleThreadExecutor()) {
            Future<?> refresh = transaction.execute(status -> {
                userService.logout(token);
                return startAndWaitUntilBlocked(pool.submit(() -> userService.refresh(token)));
            });
            ExecutionException failure = assertThrows(ExecutionException.class, () -> refresh.get(10, TimeUnit.SECONDS));
            assertInstanceOf(UnauthorizedException.class, failure.getCause());
        }
        assertEquals(0, tokenCount());
    }

    @Test
    void refreshWaitingForWithdrawalIsRejectedWith401() throws Exception {
        String token = login(PASSWORD);
        try (var pool = Executors.newSingleThreadExecutor()) {
            Future<?> refresh = transaction.execute(status -> {
                userService.withdraw(PASSWORD);
                return startAndWaitUntilBlocked(pool.submit(() -> userService.refresh(token)));
            });
            ExecutionException failure = assertThrows(ExecutionException.class, () -> refresh.get(10, TimeUnit.SECONDS));
            assertInstanceOf(UnauthorizedException.class, failure.getCause());
        }
        assertEquals(0, tokenCount());
    }

    /** 다른 트랜잭션이 끝나기를 기다리는 중임을 확인한다. */
    private static Future<?> startAndWaitUntilBlocked(Future<?> future) {
        assertThrows(TimeoutException.class, () -> future.get(500, TimeUnit.MILLISECONDS));
        return future;
    }

    private void assertRejectedWithoutSideEffect(String token) {
        long version = version();
        int tokens = tokenCount();
        assertThrows(UnauthorizedException.class, () -> userService.refresh(token));
        assertEquals(version, version());
        assertEquals(tokens, tokenCount());
    }

    private String login(String password) {
        return userService.login(new LoginCommand(EMAIL, password, "127.0.0.1")).refreshToken();
    }

    private long version() {
        return jdbc.queryForObject("select token_version from users where id = ?", Long.class, userId);
    }

    private int tokenCount() {
        return jdbc.queryForObject("select count(*) from refresh_tokens", Integer.class);
    }
}
