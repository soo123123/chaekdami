package com.chaekdami.review.application;

import com.chaekdami.config.JwtTokenProvider;
import com.chaekdami.reading.domain.Book;
import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.infrastructure.BookRepository;
import com.chaekdami.reading.infrastructure.ReadingRecordRepository;
import com.chaekdami.user.application.PasswordResetNotifier;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.UserRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** 독후감 API를 실제 트랜잭션으로 확인한다 (TODO-38). */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:bookreport;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
@AutoConfigureMockMvc
class BookReportServiceTest {

    @Autowired
    private MockMvc mvc;
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
    private TransactionTemplate transaction;
    @MockitoBean
    private PasswordResetNotifier notifier;

    private Long owner;
    private Long other;
    private Long bookId;
    private Long recordId;

    @BeforeEach
    void setUp() {
        for (String table : new String[]{"book_reports", "reviews", "reading_records", "books", "users"}) {
            jdbc.update("delete from " + table);
        }
        owner = user("owner");
        other = user("other");
        Book book = books.save(new Book(owner, null, "책", "저자", null, null, null, null, null, 300));
        bookId = book.getId();
        recordId = records.save(ReadingRecord.start(book, 1)).getId();
        jdbc.update("update reading_records set status = 'COMPLETED' where id = ?", recordId);
    }

    @Test
    void ownerReadsEditsAndDeletes() throws Exception {
        Integer id = create();

        send(get(path(id)), owner, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("처음")).andExpect(jsonPath("$.isPublic").value(false))
                .andExpect(jsonPath("$.revision").value(1));
        send(patch(path(id)), owner, "{\"isPublic\":true}").andExpect(status().isOk())
                .andExpect(jsonPath("$.isPublic").value(true)).andExpect(jsonPath("$.revision").value(1));
        send(patch(path(id)), owner, "{\"content\":\" 처음 \"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.revision").value(1)).andExpect(jsonPath("$.isPublic").value(true));
        send(patch(path(id)), owner, "{\"content\":\"두 번째\"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("두 번째")).andExpect(jsonPath("$.revision").value(2));
        send(delete(path(id)), owner, null).andExpect(status().isNoContent());
        send(get(path(id)), owner, null).andExpect(status().isNotFound());
        assertEquals(0, count());
    }

    @Test
    void anotherUserGets404EvenForAPublicReport() throws Exception {
        Integer id = create();
        send(patch(path(id)), owner, "{\"isPublic\":true}").andExpect(status().isOk());

        for (MockHttpServletRequestBuilder request : new MockHttpServletRequestBuilder[]{
                get(path(id)), patch(path(id)), delete(path(id))}) {
            send(request, other, "{\"content\":\"바꿈\"}").andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("BOOK_REPORT_NOT_FOUND"));
        }
        send(put(recordPath()), other, "{\"bookReport\":{\"content\":\"바꿈\"}}").andExpect(status().isNotFound());
        assertEquals("처음", jdbc.queryForObject("select content from book_reports", String.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void blankEditIsRejected(String content) throws Exception {
        Integer id = create();

        send(patch(path(id)), owner, "{\"content\":\"" + content + "\"}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        assertEquals("처음", jdbc.queryForObject("select content from book_reports", String.class));
    }

    @Test
    void contentIsLimitedTo2000CharactersAfterTrimming() throws Exception {
        Integer id = create();

        send(patch(path(id)), owner, "{\"content\":\" " + "가".repeat(2000) + " \"}").andExpect(status().isOk());
        send(patch(path(id)), owner, "{\"content\":\"" + "가".repeat(2001) + "\"}").andExpect(status().isBadRequest());
        send(put(recordPath()), owner, "{\"bookReport\":{\"content\":\"" + "가".repeat(2001) + "\"}}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void unfinishedRoundCannotBeSaved() throws Exception {
        jdbc.update("update reading_records set status = 'IN_PROGRESS' where id = ?", recordId);

        send(put(recordPath()), owner, "{\"bookReport\":{\"content\":\"글\"}}").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("READING_NOT_COMPLETED"));

        assertEquals(0, count());
    }

    @Test
    void invalidBookReportRollsBackTheReviewInTheSameRequest() throws Exception {
        send(put(recordPath()), owner, "{\"review\":{\"rating\":5},\"bookReport\":{\"content\":\""
                + "가".repeat(2001) + "\"}}").andExpect(status().isBadRequest());

        assertEquals(0, jdbc.queryForObject("select count(*) from reviews", Integer.class));
    }

    @Test
    void concurrentCreationOfTheSameRoundIs409AndKeepsOne() throws Exception {
        try (var pool = Executors.newSingleThreadExecutor()) {
            Future<ResultActions> late = transaction.execute(status -> {
                jdbc.update("insert into book_reports (user_id, reading_record_id, book_id, content, is_public, revision, "
                        + "created_at, updated_at) values (?, ?, ?, '먼저', false, 1, localtimestamp, localtimestamp)",
                        owner, recordId, bookId);
                Future<ResultActions> future = pool.submit(() -> send(put(recordPath()), owner,
                        "{\"review\":{\"rating\":5},\"bookReport\":{\"content\":\"나중\"}}"));
                assertThrows(TimeoutException.class, () -> future.get(1, TimeUnit.SECONDS));
                return future;
            });
            late.get(15, TimeUnit.SECONDS).andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("BOOK_REPORT_ALREADY_EXISTS"));
        }
        assertEquals("먼저", jdbc.queryForObject("select content from book_reports", String.class));
        assertEquals(0, jdbc.queryForObject("select count(*) from reviews", Integer.class));
    }

    private Integer create() throws Exception {
        String body = send(put(recordPath()), owner, "{\"bookReport\":{\"content\":\" 처음 \"}}")
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.bookReport.bookReportId");
    }

    private int count() {
        return jdbc.queryForObject("select count(*) from book_reports", Integer.class);
    }

    private static String path(Integer id) {
        return "/api/book-reports/" + id;
    }

    private String recordPath() {
        return "/api/reading-records/" + recordId + "/review";
    }

    private Long user(String name) {
        return users.save(User.builder().email(name + "@test.local").passwordHash("hash")
                .nickname(name).role(Role.USER).build()).getId();
    }

    private ResultActions send(MockHttpServletRequestBuilder request, Long userId, String body) throws Exception {
        request.header("Authorization", "Bearer " + tokens.createAccessToken(userId, "USER", 0));
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mvc.perform(request);
    }
}
