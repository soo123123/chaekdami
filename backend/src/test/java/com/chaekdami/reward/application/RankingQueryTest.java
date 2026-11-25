package com.chaekdami.reward.application;

import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

/**
 * 주간 랭킹 집계 쿼리를 실제로 실행해 확인한다. (스펙 005, ASK-14, ASK-18, TODO-43)
 * H2(메모리)를 쓰므로 팀 DB에 연결하지 않고, PostgreSQL 전용 동작은 확인하지 않는다.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:rankingquery;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
class RankingQueryTest {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final ZonedDateTime NOW = ZonedDateTime.of(2026, 11, 25, 12, 0, 0, 0, SEOUL);
    private static final LocalDateTime MONDAY = LocalDateTime.of(2026, 11, 23, 0, 0);

    @Autowired
    private RankingService rankingService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void clear() {
        jdbc.execute("set referential_integrity false");   // 세션의 독서 기록 없이 집계만 확인한다
        jdbc.update("delete from reading_sessions");
        jdbc.update("delete from reward_transactions");
        jdbc.update("delete from users");
    }

    @Test
    void 정지_중인_회원과_관리자를_빼고_순위를_비우지_않는다() {
        Long admin = user("admin", Role.ADMIN);
        Long suspended = user("banned", Role.USER);
        suspend(suspended, null);
        Long untilTomorrow = user("banned2", Role.USER);
        suspend(untilTomorrow, NOW.toLocalDateTime().plusDays(1));
        Long first = user("first", Role.USER);
        Long second = user("second", Role.USER);
        score(admin, 500);
        score(suspended, 400);
        score(untilTomorrow, 350);
        score(first, 300);
        score(second, 200);

        for (WeeklyRankingResult result : bothRankings(second)) {
            assertThat(result.rankings())
                    .extracting(WeeklyRankingResult.Entry::rank, WeeklyRankingResult.Entry::nickname,
                            WeeklyRankingResult.Entry::score, WeeklyRankingResult.Entry::me)
                    .containsExactly(tuple(1, "first", 300L, false), tuple(2, "second", 200L, true));
            assertThat(result.myRanking().rank()).isEqualTo(2);
        }
    }

    @Test
    void 제외된_사람이_많아도_상위_30명을_채운다() {
        for (int i = 0; i < 5; i++) {
            score(user("admin" + i, Role.ADMIN), 1000 + i);
        }
        for (int i = 0; i < 31; i++) {
            score(user("user" + i, Role.USER), 500 - i);
        }
        Long last = userRepository.findByEmail("user30@test.local").orElseThrow().getId();

        for (WeeklyRankingResult result : bothRankings(last)) {
            assertThat(result.rankings()).hasSize(30);
            assertThat(result.rankings().get(0).nickname()).isEqualTo("user0");
            assertThat(result.myRanking().rank()).isEqualTo(31);
        }
    }

    @Test
    void 정지가_끝났거나_해제된_회원은_다시_나온다() {
        Long ended = user("ended", Role.USER);
        suspend(ended, NOW.toLocalDateTime());   // 끝 시각이 지금이면 정지가 아니다
        Long released = user("released", Role.USER);
        suspend(released, null);
        User user = userRepository.findById(released).orElseThrow();
        user.unsuspend();
        userRepository.save(user);
        score(ended, 300);
        score(released, 200);

        for (WeeklyRankingResult result : bothRankings(ended)) {
            assertThat(result.rankings()).extracting(WeeklyRankingResult.Entry::nickname)
                    .containsExactly("ended", "released");
            assertThat(result.myRanking().rank()).isEqualTo(1);
        }
    }

    @Test
    void 관리자_본인은_점수는_받지만_순위는_없다() {
        Long admin = user("admin", Role.ADMIN);
        score(admin, 500);

        for (WeeklyRankingResult result : bothRankings(admin)) {
            assertThat(result.rankings()).isEmpty();
            assertThat(result.myRanking().rank()).isNull();
            assertThat(result.myRanking().score()).isEqualTo(500);
        }
    }

    @Test
    void 합계가_0이거나_이번_주가_아니면_나오지_않는다() {
        Long zero = user("zero", Role.USER);
        score(zero, 0);
        Long lastWeek = user("lastweek", Role.USER);
        score(lastWeek, 900, MONDAY.minusSeconds(1));
        Long nextWeek = user("nextweek", Role.USER);
        score(nextWeek, 900, MONDAY.plusDays(7));
        Long monday = user("monday", Role.USER);
        score(monday, 100, MONDAY);

        for (WeeklyRankingResult result : bothRankings(zero)) {
            assertThat(result.rankings()).extracting(WeeklyRankingResult.Entry::nickname).containsExactly("monday");
            assertThat(result.myRanking().rank()).isNull();
        }
    }

    @Test
    void 여러_기록을_합하고_동점은_같은_순위에_사용자_번호_순이다() {
        Long a = user("a", Role.USER);
        Long b = user("b", Role.USER);
        Long c = user("c", Role.USER);
        score(b, 300);
        score(a, 100);
        score(a, 200);
        score(c, 50);

        for (WeeklyRankingResult result : bothRankings(c)) {
            assertThat(result.rankings())
                    .extracting(WeeklyRankingResult.Entry::rank, WeeklyRankingResult.Entry::nickname)
                    .containsExactly(tuple(1, "a"), tuple(1, "b"), tuple(3, "c"));
            assertThat(result.myRanking().rank()).isEqualTo(3);
        }
    }

    private WeeklyRankingResult[] bothRankings(Long userId) {
        return new WeeklyRankingResult[]{
                rankingService.getWeeklyExperienceRanking(userId, NOW, SEOUL),
                rankingService.getWeeklyReadingTimeRanking(userId, NOW, SEOUL)};
    }

    private Long user(String name, Role role) {
        return userRepository.save(User.builder()
                .email(name + "@test.local").passwordHash("x").nickname(name).role(role).build()).getId();
    }

    private void suspend(Long userId, LocalDateTime until) {
        User user = userRepository.findById(userId).orElseThrow();
        user.suspend("test", until, null, NOW.toLocalDateTime().minusDays(1));
        userRepository.save(user);
    }

    private void score(Long userId, int score) {
        score(userId, score, MONDAY.plusDays(1));
    }

    /** 경험치와 독서 시간을 같은 점수로 넣는다. */
    private void score(Long userId, int score, LocalDateTime at) {
        Timestamp time = Timestamp.valueOf(at);
        jdbc.update("insert into reward_transactions (user_id, type, amount, reason, created_at)"
                + " values (?, 'INCOME_EXPERIENCE', ?, 'DAILY_QUEST', ?)", userId, score, time);
        jdbc.update("insert into reading_sessions (user_id, reading_record_id, started_at, ended_at, duration_seconds,"
                + " start_page, end_page, created_at) values (?, 1, ?, ?, ?, 1, 2, ?)", userId, time, time, score, time);
    }
}
