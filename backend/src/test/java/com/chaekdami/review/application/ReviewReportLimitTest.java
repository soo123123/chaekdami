package com.chaekdami.review.application;

import com.chaekdami.config.JwtTokenProvider;
import com.chaekdami.global.error.BusinessException;
import com.chaekdami.review.application.command.ReviewReportCommand;
import com.chaekdami.review.domain.ReportReason;
import com.chaekdami.review.domain.Review;
import com.chaekdami.review.domain.ReviewErrorCode;
import com.chaekdami.review.infrastructure.ReviewRepository;
import com.chaekdami.user.application.PasswordResetNotifier;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static com.chaekdami.review.ReviewFixtures.signIn;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 회원별 하루 신고 제한 (스펙 011). */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:reportlimit;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
@AutoConfigureMockMvc
class ReviewReportLimitTest {

    private static final int REVIEWS = 25;

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ReviewSocialService service;
    @Autowired
    private ReviewRepository reviews;
    @Autowired
    private UserRepository users;
    @Autowired
    private JwtTokenProvider tokens;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private KoreanTime koreanTime;
    @Autowired
    private TransactionTemplate transaction;
    @MockitoBean
    private PasswordResetNotifier notifier;

    private Long reporterId;
    private Long otherId;
    private final List<Long> reviewIds = new ArrayList<>();

    @BeforeEach
    void setUp() {
        jdbc.update("delete from review_reports");
        jdbc.update("delete from reviews");
        jdbc.update("delete from users");
        reporterId = saveUser("reporter");
        otherId = saveUser("other");
        Long authorId = saveUser("author");
        for (int i = 0; i < REVIEWS; i++) {
            reviewIds.add(saveReview(authorId, (long) i + 1));
        }
        signIn(reporterId);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void twentyFirstReportOfTheDayIs429AndLeavesNoTrace() throws Exception {
        report(0, 20);
        Long reviewId = reviewIds.get(20);
        jdbc.update("update reviews set report_count = 2 where id = ?", reviewId);

        mvc.perform(post("/api/reviews/" + reviewId + "/reports")
                        .header("Authorization", "Bearer " + tokens.createAccessToken(reporterId, "USER", 0))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"SPAM\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("TOO_MANY_ATTEMPTS"));

        assertEquals(20, reports(reporterId));
        assertEquals(2, jdbc.queryForObject("select report_count from reviews where id = ?", Integer.class, reviewId));
        assertEquals(false, jdbc.queryForObject("select is_blinded from reviews where id = ?", Boolean.class, reviewId));
    }

    @Test
    void reportsOfYesterdayInKoreaDoNotCount() {
        report(0, 20);
        LocalDateTime today = koreanTime.today().atStartOfDay();
        jdbc.update("update review_reports set created_at = ?", today.minusNanos(1000));
        report(20, 25);
        assertEquals(25, reports(reporterId));
    }

    @Test
    void reportsFromTheStartOfTodayCount() {
        report(0, 20);
        jdbc.update("update review_reports set created_at = ?", koreanTime.today().atStartOfDay());

        assertEquals(ReviewErrorCode.TOO_MANY_ATTEMPTS, errorOf(reviewIds.get(20)));
    }

    @Test
    void rejectedReportsDoNotCount() {
        report(0, 19);
        Long mine = saveReview(reporterId, 100L);
        for (int i = 0; i < 3; i++) {
            assertEquals(ReviewErrorCode.ALREADY_REPORTED, errorOf(reviewIds.get(0)));
            assertEquals(ReviewErrorCode.CANNOT_REPORT_OWN_REVIEW, errorOf(mine));
            assertEquals(ReviewErrorCode.REVIEW_NOT_FOUND, errorOf(-1L));
        }

        report(19, 20);

        assertEquals(20, reports(reporterId));
        assertEquals(ReviewErrorCode.ALREADY_REPORTED, errorOf(reviewIds.get(0)));
    }

    @Test
    void otherUsersAreNotAffected() {
        report(0, 20);
        signIn(otherId);

        report(20, 21);

        assertEquals(1, reports(otherId));
    }

    @Test
    void concurrentReportsNeverExceedTheLimit() throws Exception {
        report(0, 15);
        List<Callable<Boolean>> calls = new ArrayList<>();
        for (Long reviewId : reviewIds.subList(15, 25)) {
            calls.add(() -> {
                signIn(reporterId);
                try {
                    service.report(reviewId, new ReviewReportCommand(ReportReason.SPAM, null));
                    return true;
                } catch (BusinessException exception) {
                    assertEquals(ReviewErrorCode.TOO_MANY_ATTEMPTS, exception.getErrorCode());
                    return false;
                } finally {
                    SecurityContextHolder.clearContext();
                }
            });
        }
        int allowed = 0;
        try (var pool = Executors.newFixedThreadPool(5)) {
            for (Future<Boolean> result : pool.invokeAll(calls)) {
                allowed += result.get() ? 1 : 0;
            }
        }
        assertEquals(5, allowed);
        assertEquals(20, reports(reporterId));
    }

    @Test
    void reportWaitsForAnUncommittedReportOfTheSameUserAndCountsIt() throws Exception {
        report(0, 19);
        try (var pool = Executors.newSingleThreadExecutor()) {
            Future<Object> late = transaction.execute(status -> {
                report(19, 20);
                Future<Object> future = pool.submit(() -> {
                    signIn(reporterId);
                    return errorOf(reviewIds.get(20));
                });
                assertThrows(TimeoutException.class, () -> future.get(1, TimeUnit.SECONDS));
                return future;
            });
            assertEquals(ReviewErrorCode.TOO_MANY_ATTEMPTS, late.get(15, TimeUnit.SECONDS));
        }
        assertEquals(20, reports(reporterId));
    }

    private void report(int from, int to) {
        for (Long reviewId : reviewIds.subList(from, to)) {
            service.report(reviewId, new ReviewReportCommand(ReportReason.SPAM, null));
        }
    }

    private Object errorOf(Long reviewId) {
        return assertThrows(BusinessException.class,
                () -> service.report(reviewId, new ReviewReportCommand(ReportReason.SPAM, null))).getErrorCode();
    }

    private Long saveUser(String name) {
        return users.save(User.builder().email(name + "@test.local").passwordHash("hash")
                .nickname(name).role(Role.USER).build()).getId();
    }

    private Long saveReview(Long userId, Long bookId) {
        return reviews.save(Review.builder().userId(userId).bookId(bookId).isbn("9791162540640")
                .rating(5).oneLine("한줄평").isSpoiler(false).isPublic(true).build()).getId();
    }

    private int reports(Long userId) {
        return jdbc.queryForObject("select count(*) from review_reports where user_id = ?", Integer.class, userId);
    }
}
