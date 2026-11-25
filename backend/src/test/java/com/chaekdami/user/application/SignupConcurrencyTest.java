package com.chaekdami.user.application;

import com.chaekdami.user.application.command.SignupCommand;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
    @MockitoBean
    private PasswordResetNotifier notifier;

    @BeforeEach
    void setUp() {
        jdbc.update("delete from users");
    }

    @Test
    void sameEmailIs409() throws Exception {
        // 서버가 DB 오류 문구에서 칸 이름을 찾는데, H2 문구에는 INSERT 문 전체가 들어 있어 code는 비교하지 않는다.
        signupWhileAnotherIsUncommitted("first@test.local", "first", "FIRST@test.local", "second")
                .andExpect(status().isConflict());
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
                userService.signup(new SignupCommand(email, PASSWORD, nickname));
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
