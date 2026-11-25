package com.chaekdami.review.application;

import com.chaekdami.config.JwtTokenProvider;
import com.chaekdami.review.application.command.ReviewReportCommand;
import com.chaekdami.review.domain.ReportReason;
import com.chaekdami.review.domain.Review;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static com.chaekdami.review.ReviewFixtures.signIn;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 한줄평 관리자 API와 좋아요 수의 동시성을 실제 트랜잭션으로 확인한다 (TODO-38). */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:reviewadmin;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
@AutoConfigureMockMvc
class ReviewAdminLikeTest {

    private static final String REPORTED = "/api/admin/reviews/reported";
    private static final String ISBN = "9791162540640";

    @Autowired
    private MockMvc mvc;
    @Autowired
    private ReviewSocialService social;
    @Autowired
    private ReviewRepository reviews;
    @Autowired
    private UserRepository users;
    @Autowired
    private JwtTokenProvider tokens;
    @Autowired
    private JdbcTemplate jdbc;
    @MockitoBean
    private PasswordResetNotifier notifier;

    private Long admin;
    private final List<Long> readers = new ArrayList<>();
    private Long reviewId;
    private Long onceReportedId;

    @BeforeEach
    void setUp() {
        for (String table : new String[]{"review_reports", "review_likes", "reviews", "users"}) {
            jdbc.update("delete from " + table);
        }
        admin = user("admin", Role.ADMIN);
        Long author = user("author", Role.USER);
        for (int i = 0; i < 5; i++) {
            readers.add(user("reader" + i, Role.USER));
        }
        reviewId = review(author, 1L);
        onceReportedId = review(author, 2L);
        review(author, 3L);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void reportedListIsSortedFilteredAndPaged() throws Exception {
        reportAll();

        call(get(REPORTED), null).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.items[0].reviewId").value(reviewId))
                .andExpect(jsonPath("$.items[0].reportCount").value(3))
                .andExpect(jsonPath("$.items[0].isBlinded").value(true))
                .andExpect(jsonPath("$.items[0].reportReasons.SPAM").value(2))
                .andExpect(jsonPath("$.items[0].reportReasons.ABUSIVE").value(1))
                .andExpect(jsonPath("$.items[0].author.nickname").value("author"))
                .andExpect(jsonPath("$.items[1].reviewId").value(onceReportedId));
        call(get(REPORTED + "?blinded=true"), null).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].reviewId").value(reviewId));
        call(get(REPORTED + "?blinded=false"), null).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].reviewId").value(onceReportedId));
        call(get(REPORTED + "?page=1&size=1"), null).andExpect(jsonPath("$.items[0].reviewId").value(onceReportedId))
                .andExpect(jsonPath("$.hasNext").value(false));
        call(get(REPORTED + "?page=-1"), null).andExpect(status().isBadRequest());
        call(get(REPORTED + "?size=51"), null).andExpect(status().isBadRequest());
    }

    @Test
    void unblindResetsTheCountKeepsReportsAndShowsTheReviewAgain() throws Exception {
        reportAll();
        signIn(readers.get(0));
        assertEquals(2, social.publicReviews(ISBN, "latest", 0, 20).totalElements());
        assertEquals(2, social.ratingSummary(ISBN).ratingCount());

        call(patch(blindPath(reviewId)), "{\"blinded\":false}").andExpect(status().isOk())
                .andExpect(jsonPath("$.isBlinded").value(false)).andExpect(jsonPath("$.reportCount").value(0))
                .andExpect(jsonPath("$.reportReasons.SPAM").value(2));

        signIn(readers.get(0));
        assertEquals(3, social.publicReviews(ISBN, "latest", 0, 20).totalElements());
        assertEquals(3, social.ratingSummary(ISBN).ratingCount());
        call(post("/api/reviews/" + reviewId + "/reports"), readers.get(0), "USER", "{\"reason\":\"SPAM\"}")
                .andExpect(status().isConflict());
    }

    @Test
    void adminBlindsWithoutReportsAndRepeatingKeepsTheFirstTime() throws Exception {
        call(patch(blindPath(onceReportedId)), "{\"blinded\":true}").andExpect(status().isOk())
                .andExpect(jsonPath("$.isBlinded").value(true)).andExpect(jsonPath("$.reportCount").value(0));
        jdbc.update("update reviews set blinded_at = timestamp '2026-01-01 00:00:00' where id = ?", onceReportedId);

        call(patch(blindPath(onceReportedId)), "{\"blinded\":true}").andExpect(status().isOk())
                .andExpect(jsonPath("$.blindedAt").value("2026-01-01T00:00:00"));
    }

    @Test
    void rejectsMissingReviewBadInputAndNonAdmins() throws Exception {
        call(patch(blindPath(-1L)), "{\"blinded\":true}").andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("REVIEW_NOT_FOUND"));
        call(patch(blindPath(reviewId)), "{}").andExpect(status().isBadRequest());
        call(get(REPORTED), readers.get(0), "USER", null).andExpect(status().isForbidden());
        call(patch(blindPath(reviewId)), readers.get(0), "USER", "{\"blinded\":true}").andExpect(status().isForbidden());
    }

    @Test
    void concurrentLikesOfDifferentUsersAreAllCounted() throws Exception {
        runAll(readers, () -> social.like(reviewId));

        assertEquals(5, likeCount());
        assertEquals(5, likeRows());
        runAll(readers, () -> social.unlike(reviewId));
        assertEquals(0, likeCount());
        assertEquals(0, likeRows());
    }

    @Test
    void repeatedConcurrentLikesAndUnlikesOfOneUserCountOnce() throws Exception {
        signIn(readers.get(1));
        social.like(reviewId);
        List<Long> same = Collections.nCopies(5, readers.get(0));

        runAll(same, () -> social.like(reviewId));
        assertEquals(2, likeCount());
        assertEquals(2, likeRows());

        runAll(same, () -> social.unlike(reviewId));
        assertEquals(1, likeCount());
        assertEquals(1, likeRows());
    }

    private void reportAll() {
        for (int i = 0; i < 3; i++) {
            signIn(readers.get(i));
            social.report(reviewId, new ReviewReportCommand(i == 0 ? ReportReason.ABUSIVE : ReportReason.SPAM, null));
        }
        social.report(onceReportedId, new ReviewReportCommand(ReportReason.SPAM, null));
    }

    private void runAll(List<Long> userIds, Runnable action) throws Exception {
        List<Callable<Void>> calls = new ArrayList<>();
        for (Long userId : userIds) {
            calls.add(() -> {
                signIn(userId);
                try {
                    action.run();
                } finally {
                    SecurityContextHolder.clearContext();
                }
                return null;
            });
        }
        try (var pool = Executors.newFixedThreadPool(5)) {
            for (Future<Void> result : pool.invokeAll(calls)) {
                result.get();
            }
        }
    }

    private int likeCount() {
        return jdbc.queryForObject("select like_count from reviews where id = ?", Integer.class, reviewId);
    }

    private int likeRows() {
        return jdbc.queryForObject("select count(*) from review_likes where review_id = ?", Integer.class, reviewId);
    }

    private static String blindPath(Long id) {
        return "/api/admin/reviews/" + id + "/blind";
    }

    private Long user(String name, Role role) {
        return users.save(User.builder().email(name + "@test.local").passwordHash("hash")
                .nickname(name).role(role).build()).getId();
    }

    private Long review(Long userId, Long bookId) {
        return reviews.save(Review.builder().userId(userId).bookId(bookId).isbn(ISBN)
                .rating(5).oneLine("한줄평").isSpoiler(false).isPublic(true).build()).getId();
    }

    private ResultActions call(MockHttpServletRequestBuilder request, String body) throws Exception {
        return call(request, admin, "ADMIN", body);
    }

    private ResultActions call(MockHttpServletRequestBuilder request, Long userId, String role, String body)
            throws Exception {
        request.header("Authorization", "Bearer " + tokens.createAccessToken(userId, role, 0));
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mvc.perform(request);
    }
}
