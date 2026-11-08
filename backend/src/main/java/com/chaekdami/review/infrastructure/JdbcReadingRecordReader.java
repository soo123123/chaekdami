package com.chaekdami.review.infrastructure;

import com.chaekdami.review.application.port.ReadingRecordReader;
import com.chaekdami.review.application.port.ReadingRecordView;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * BE1 독서 도메인이 병합되기 전까지 reading_records 테이블을 직접 읽는 임시 구현.
 * 병합 후에는 BE1 서비스를 호출하는 구현으로 교체하고 이 클래스는 삭제한다.
 */
@Component
@RequiredArgsConstructor
public class JdbcReadingRecordReader implements ReadingRecordReader {

    private static final String SELECT = """
            select id, user_id, book_id, round, status, started_at, completed_at
            from reading_records
            """;

    private static final RowMapper<ReadingRecordView> ROW_MAPPER = (rs, rowNum) -> new ReadingRecordView(
            rs.getLong("id"),
            rs.getLong("user_id"),
            rs.getLong("book_id"),
            rs.getInt("round"),
            rs.getString("status"),
            toLocalDateTime(rs.getTimestamp("started_at")),
            toLocalDateTime(rs.getTimestamp("completed_at")));

    private final NamedParameterJdbcTemplate jdbc;

    @Override
    public Optional<ReadingRecordView> find(Long readingRecordId) {
        return jdbc.query(SELECT + "where id = :id", Map.of("id", readingRecordId), ROW_MAPPER)
                .stream().findFirst();
    }

    @Override
    public List<ReadingRecordView> findAll(Collection<Long> readingRecordIds) {
        if (readingRecordIds.isEmpty()) {
            return List.of();
        }
        return jdbc.query(SELECT + "where id in (:ids)", Map.of("ids", readingRecordIds), ROW_MAPPER);
    }

    @Override
    public boolean hasCompletedRound(Long bookId) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                select exists (
                    select 1 from reading_records
                    where book_id = :bookId and status = 'COMPLETED'
                )
                """, Map.of("bookId", bookId), Boolean.class));
    }

    @Override
    public boolean hasCompletedRoundByIsbn(Long userId, String isbn) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
                select exists (
                    select 1 from reading_records rr
                    join books b on b.id = rr.book_id
                    where rr.user_id = :userId and b.isbn = :isbn and rr.status = 'COMPLETED'
                )
                """, Map.of("userId", userId, "isbn", isbn), Boolean.class));
    }

    private static LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp != null ? timestamp.toLocalDateTime() : null;
    }
}
