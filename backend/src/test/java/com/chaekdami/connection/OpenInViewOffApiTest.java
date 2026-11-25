package com.chaekdami.connection;

import com.chaekdami.config.JwtTokenProvider;
import com.chaekdami.user.application.PasswordResetNotifier;
import com.chaekdami.user.domain.Role;
import com.chaekdami.user.domain.User;
import com.chaekdami.user.infrastructure.UserRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * open-in-view를 끈 실제 설정에서 데이터를 만든 뒤 조회 API가 지연 로딩 오류 없이 응답하는지 확인한다 (ISSUE-BUG-8).
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:api;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
        "spring.jpa.properties.hibernate.show_sql=false",
        "jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
@AutoConfigureMockMvc
class OpenInViewOffApiTest {

    @Autowired
    private MockMvc mvc;
    @Autowired
    private UserRepository users;
    @Autowired
    private JwtTokenProvider tokens;
    @MockitoBean
    private PasswordResetNotifier notifier;

    private String authorization;

    @Test
    void readApisRespondAfterARealReadingFlow() throws Exception {
        Long userId = users.save(User.builder().email("api@test.local").passwordHash("hash")
                .nickname("api").role(Role.ADMIN).build()).getId();
        authorization = "Bearer " + tokens.createAccessToken(userId, "ADMIN", 0);

        Integer bookId = id(postJson("/api/books",
                "{\"title\":\"책\",\"isbn\":\"9791162540640\",\"totalPages\":100}"), "$.id");
        String records = body(get("/api/books/" + bookId + "/reading-records"));
        Integer recordId = JsonPath.read(records, "$[0].id");
        mvc.perform(multipart("/api/reading-records/" + recordId + "/certifications")
                .file(new MockMultipartFile("image", "page.jpg", "image/jpeg", new byte[]{1}))
                .header("Authorization", authorization)).andExpect(status().isCreated());
        Integer sessionId = id(postJson("/api/reading-sessions", "{\"bookId\":" + bookId
                + ",\"readingTime\":600,\"startPage\":1,\"endPage\":100,\"sentence\":\"문장\"}"), "$.id");
        postJson("/api/rewards/reading-sessions/" + sessionId, "{}");
        postJson("/api/books/" + bookId + "/review", "{\"rating\":5,\"oneLine\":\"한줄평\"}");

        for (String path : List.of(
                "/api/books", "/api/books/" + bookId,
                "/api/books/" + bookId + "/reading-records",
                "/api/reading-records/" + recordId,
                "/api/reading-records/" + recordId + "/sessions",
                "/api/reading-records/" + recordId + "/certifications",
                "/api/reading-records/" + recordId + "/sentences",
                "/api/reading-records/" + recordId + "/sentence-collection",
                "/api/reading-records/" + recordId + "/review",
                "/api/books/" + bookId + "/review",
                "/api/me/sentence-collections", "/api/me/reading-today", "/api/me/reading-stats", "/api/me",
                "/api/reviews?isbn=9791162540640", "/api/reviews/rating-summary?isbn=9791162540640",
                "/api/quests", "/api/rewards", "/api/shop/items", "/api/dday",
                "/api/admin/users", "/api/admin/users?query=api&role=ADMIN&status=ACTIVE",
                "/api/admin/users/" + userId, "/api/admin/reviews/reported",
                "/api/books/" + bookId + "/community", "/api/books/" + bookId + "/community/entries",
                "/api/admin/book-reports/reported", "/api/admin/sentences/reported")) {
            assertFalse(body(get(path)).isBlank(), path);
        }
    }

    private String postJson(String path, String json) throws Exception {
        return body(post(path).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private Integer id(String json, String path) {
        return JsonPath.read(json, path);
    }

    private String body(MockHttpServletRequestBuilder request) throws Exception {
        return mvc.perform(request.header("Authorization", authorization))
                .andExpect(status().is2xxSuccessful())
                .andReturn().getResponse().getContentAsString();
    }
}
