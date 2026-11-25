package com.chaekdami.reward.application;

import com.chaekdami.reward.domain.RankingWeek;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 주간 퀘스트를 실제 조회와 저장으로 확인한다. (스펙 013)
 * H2(메모리)를 쓰므로 팀 DB에 연결하지 않고, PostgreSQL 전용 동작은 확인하지 않는다.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:weeklyquest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
class WeeklyQuestTest {

    @Autowired
    private QuestService questService;
    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void 처음_조회하면_일일_3개_다음에_주간_3개를_받고_다시_조회해도_늘지_않는다() {
        List<QuestResult> first = questService.getTodayQuests(201L);
        List<QuestResult> second = questService.getTodayQuests(201L);

        assertThat(first).extracting(quest -> quest.type().name())
                .containsExactly("DAILY", "DAILY", "DAILY", "WEEKLY", "WEEKLY", "WEEKLY");
        assertThat(first.subList(3, 6)).extracting(QuestResult::title)
                .containsExactly("이번 주 독서 5번 하기", "이번 주 100분 독서하기", "이번 주 200분 독서하기");
        assertThat(second).extracting(QuestResult::userQuestId)
                .containsExactlyInAnyOrderElementsOf(first.stream().map(QuestResult::userQuestId).toList());
        assertThat(count(201L, "WEEKLY")).isEqualTo(3);
    }

    @Test
    void 주간_퀘스트가_있어도_다음_날_일일_퀘스트를_만든다() {
        questService.getTodayQuests(202L);
        // 일일은 어제 만든 것으로 바꾼다. 주간은 그대로 둔다.
        move(202L, "DAILY", LocalDateTime.now().minusDays(1));

        assertThat(questService.getTodayQuests(202L)).hasSize(6);
        assertThat(count(202L, "DAILY")).isEqualTo(6);
        assertThat(count(202L, "WEEKLY")).isEqualTo(3);
    }

    @Test
    void 주간은_한국_시간_월요일_0시부터_다음_월요일_0시_직전까지의_것을_쓴다() {
        RankingWeek week = RankingWeek.containing(LocalDateTime.now().atZone(ZoneId.systemDefault()));
        LocalDateTime start = week.startAt(ZoneId.systemDefault());
        questService.getTodayQuests(203L);
        move(203L, "WEEKLY", start);
        questService.getTodayQuests(203L);
        assertThat(count(203L, "WEEKLY")).isEqualTo(3);

        move(203L, "WEEKLY", start.minusNanos(1_000_000));
        List<QuestResult> newWeek = questService.getTodayQuests(203L);

        assertThat(count(203L, "WEEKLY")).isEqualTo(6);
        assertThat(newWeek.subList(3, 6)).allMatch(quest -> quest.currentProgress() == 0);
    }

    @Test
    void 다섯_번_읽으면_한_번만_지급하고_이력에_사용자_퀘스트_번호를_남긴다() {
        for (int i = 0; i < 6; i++) {
            questService.recordReadingSession(204L, 180);
        }

        assertThat(jdbc.queryForList("""
                select q.code || ':' || t.type || ':' || t.amount from reward_transactions t
                join user_quests uq on uq.id = t.reference_id join quests q on q.id = uq.quest_id
                where t.user_id = 204 and t.reason = 'DAILY_QUEST' and uq.user_id = 204 and q.type = 'WEEKLY'
                """, String.class))
                .containsExactlyInAnyOrder("WEEKLY_SESSION_5:INCOME_CURRENCY:150", "WEEKLY_SESSION_5:INCOME_EXPERIENCE:30");
        assertThat(jdbc.queryForObject("select count(*) from reward_transactions where user_id = 204"
                + " and reason = 'DAILY_QUEST' and reference_id is null", Integer.class)).isZero();
        assertThat(progress(204L, "WEEKLY_READING_100_MINUTES")).isEqualTo(18);
    }

    @Test
    void 지난_주_세션은_새_주간_퀘스트를_만들지_않고_이번_주_것도_바꾸지_않는다() {
        questService.recordReadingSession(205L, 600, LocalDateTime.now().minusDays(8));
        assertThat(count(205L, "WEEKLY")).isZero();

        questService.getTodayQuests(205L);
        questService.recordReadingSession(205L, 600, LocalDateTime.now().minusDays(8));
        assertThat(progress(205L, "WEEKLY_READING_100_MINUTES")).isZero();
    }

    @Test
    void 첫_요청이_겹쳐도_한_벌만_만든다() throws Exception {
        questService.recordReadingSession(206L, 180, LocalDateTime.now().minusDays(30));   // 보상 계정만 만든다
        int threads = 6;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        try {
            CountDownLatch start = new CountDownLatch(1);
            List<Future<?>> futures = new ArrayList<>();
            for (int i = 0; i < threads; i++) {
                futures.add(executor.submit(() -> {
                    start.await();
                    return questService.getTodayQuests(206L);
                }));
            }
            start.countDown();
            for (Future<?> future : futures) {
                future.get(20, TimeUnit.SECONDS);
            }
        } finally {
            executor.shutdownNow();
        }

        assertThat(count(206L, "DAILY")).isEqualTo(3);
        assertThat(count(206L, "WEEKLY")).isEqualTo(3);
    }

    private int count(long userId, String type) {
        return jdbc.queryForObject("select count(*) from user_quests uq join quests q on q.id = uq.quest_id"
                + " where uq.user_id = ? and q.type = ?", Integer.class, userId, type);
    }

    private int progress(long userId, String code) {
        return jdbc.queryForObject("select uq.progress from user_quests uq join quests q on q.id = uq.quest_id"
                + " where uq.user_id = ? and q.code = ?", Integer.class, userId, code);
    }

    private void move(long userId, String type, LocalDateTime createdAt) {
        jdbc.update("update user_quests set created_at = ? where user_id = ?"
                        + " and quest_id in (select id from quests where type = ?)",
                Timestamp.valueOf(createdAt), userId, type);
    }
}
