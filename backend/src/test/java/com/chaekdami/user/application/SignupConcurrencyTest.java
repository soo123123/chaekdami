package com.chaekdami.user.application;

import com.chaekdami.user.application.command.SignupCommand;
import com.chaekdami.user.presentation.GlobalExceptionHandler;
import com.chaekdami.user.presentation.dto.ApiErrorResponse;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.util.Locale;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 같은 이메일·닉네임으로 동시에 가입하면 한 명만 성공하는지 확인한다 (TODO-38). */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:signup;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
@AutoConfigureMockMvc
class SignupConcurrencyTest {

    private static final String PASSWORD = "Password1!";

    @Autowired
    private MockMvc mvc;
    @Autowired
    private UserService userService;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private TransactionTemplate transaction;
    @Autowired
    private DataSource dataSource;
    @MockitoSpyBean
    private PasswordEncoder encoder;
    @MockitoBean
    private PasswordResetNotifier notifier;

    @BeforeEach
    void setUp() {
        jdbc.update("delete from users");
    }

    @Test
    void sameEmailIs409() throws Exception {
        signupWhileAnotherIsUncommitted("first@test.local", "first", "FIRST@test.local", "second")
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    void sameEmailContainingTheWordNicknameIsStillAnEmailConflict() throws Exception {
        signupWhileAnotherIsUncommitted("nickname@test.local", "first", "nickname@test.local", "second")
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("EMAIL_ALREADY_EXISTS"));
    }

    @Test
    void otherIntegrityErrorsAreNotReportedAsDuplicates() {
        ResponseEntity<ApiErrorResponse> response = new GlobalExceptionHandler().handleDataIntegrity(
                new DataIntegrityViolationException("value too long: nickname email"));

        assertEquals(500, response.getStatusCode().value());
    }

    @Test
    void signupHashesThePasswordWithoutHoldingAConnection() throws Exception {
        doAnswer(invocation -> {
            assertEquals(0, ((HikariDataSource) dataSource).getHikariPoolMXBean().getActiveConnections());
            return invocation.callRealMethod();
        }).when(encoder).encode(any());

        signup("first@test.local", "first").andExpect(status().isCreated());

        verify(encoder).encode(PASSWORD);
    }

    @Test
    void sameNicknameIgnoringCaseIs409() throws Exception {
        signupWhileAnotherIsUncommitted("first@test.local", "Reader", "second@test.local", "reADER")
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("NICKNAME_ALREADY_EXISTS"));
    }

    @Test
    void differentUsersBothSucceed() throws Exception {
        userService.signup(new SignupCommand("first@test.local", PASSWORD, "first"));

        signup("second@test.local", "second").andExpect(status().isCreated());

        assertEquals(2, count());
    }

    private ResultActions signupWhileAnotherIsUncommitted(String email, String nickname,
                                                          String lateEmail, String lateNickname) throws Exception {
        ResultActions result;
        try (var pool = Executors.newSingleThreadExecutor()) {
            Future<ResultActions> late = transaction.execute(status -> {
                jdbc.update("insert into users (email, password_hash, nickname, nickname_lower, role, created_at, "
                        + "token_version) values (?, 'hash', ?, ?, 'USER', localtimestamp, 0)",
                        email, nickname, nickname.toLowerCase(Locale.ROOT));
                Future<ResultActions> future = pool.submit(() -> signup(lateEmail, lateNickname));
                assertThrows(TimeoutException.class, () -> future.get(1, TimeUnit.SECONDS));
                return future;
            });
            result = late.get(15, TimeUnit.SECONDS);
        }
        assertEquals(1, count());
        return result;
    }

    private ResultActions signup(String email, String nickname) throws Exception {
        return mvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(
                "{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\",\"nickname\":\"" + nickname + "\"}"));
    }

    private int count() {
        return jdbc.queryForObject("select count(*) from users", Integer.class);
    }
}
