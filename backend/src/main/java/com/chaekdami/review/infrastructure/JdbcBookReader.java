package com.chaekdami.review.infrastructure;

import com.chaekdami.review.application.port.BookReader;
import com.chaekdami.review.application.port.BookView;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * BE1 독서 도메인이 병합되기 전까지 books 테이블을 직접 읽는 임시 구현.
 * 병합 후에는 BE1 서비스를 호출하는 구현으로 교체하고 이 클래스는 삭제한다.
 */
@Component
@RequiredArgsConstructor
public class JdbcBookReader implements BookReader {

    private static final String SELECT = """
            select id, user_id, title, author, cover_url, isbn, total_pages
            from books
            """;

    private static final RowMapper<BookView> ROW_MAPPER = (rs, rowNum) -> new BookView(
            rs.getLong("id"),
            rs.getLong("user_id"),
            rs.getString("title"),
            rs.getString("author"),
            rs.getString("cover_url"),
            rs.getString("isbn"),
            rs.getObject("total_pages", Integer.class));

    private final NamedParameterJdbcTemplate jdbc;

    @Override
    public Optional<BookView> find(Long bookId) {
        return jdbc.query(SELECT + "where id = :id", Map.of("id", bookId), ROW_MAPPER)
                .stream().findFirst();
    }

    @Override
    public Map<Long, BookView> findAll(Collection<Long> bookIds) {
        if (bookIds.isEmpty()) {
            return Map.of();
        }
        return jdbc.query(SELECT + "where id in (:ids)", Map.of("ids", bookIds), ROW_MAPPER).stream()
                .collect(Collectors.toMap(BookView::bookId, Function.identity()));
    }
}
