package com.chaekdami.review.infrastructure;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 같은 ISBN을 완독한 다른 사용자의 공개 모음집과 독후감을 읽는 읽기 전용 조회.
 * books, reading_records, users는 다른 도메인 테이블이라 쓰지 않고 읽기만 한다.
 */
@Repository
@RequiredArgsConstructor
public class CommunityQueryRepository {

    private static final int BOOK_REPORT_PREVIEW_LENGTH = 150;

    /**
     * 한 행이 완독한 회차 하나다. 같은 사람이 여러 번 완독했으면 회차마다 행이 따로 나온다.
     */
    private static final String ENTRY_FROM = """
            from reading_records rr
            join books b on b.id = rr.book_id
            join users u on u.id = rr.user_id
            left join sentence_collection_settings scs on scs.reading_record_id = rr.id
            left join lateral (
                select count(*) as cnt from sentences s where s.reading_record_id = rr.id
            ) sc on true
            left join book_reports br on br.reading_record_id = rr.id and br.is_public
            where b.isbn = :isbn
              and rr.status = 'COMPLETED'
              and ((scs.is_public and sc.cnt > 0) or br.id is not null)
            """;

    private static final String ENTRY_SELECT = """
            select rr.id as reading_record_id, rr.round, rr.started_at, rr.completed_at,
                   rr.user_id, u.nickname,
                   case when scs.is_public and sc.cnt > 0 then sc.cnt end as sentence_count,
                   br.id as book_report_id,
                   left(br.content, :previewLength) as book_report_preview,
                   char_length(br.content) as book_report_length
            """;

    private static final RowMapper<EntryRow> ENTRY_MAPPER = (rs, rowNum) -> new EntryRow(
            rs.getLong("reading_record_id"),
            rs.getInt("round"),
            toLocalDateTime(rs.getTimestamp("started_at")),
            toLocalDateTime(rs.getTimestamp("completed_at")),
            rs.getLong("user_id"),
            rs.getString("nickname"),
            rs.getObject("sentence_count", Long.class),
            rs.getObject("book_report_id", Long.class),
            rs.getString("book_report_preview"),
            rs.getObject("book_report_length", Integer.class));

    private final NamedParameterJdbcTemplate jdbc;

    public Counts counts(String isbn) {
        return jdbc.queryForObject("""
                select count(distinct rr.user_id) as completer_count,
                       count(*) filter (where scs.is_public and sc.cnt > 0) as public_collection_count,
                       count(br.id) as public_book_report_count
                from reading_records rr
                join books b on b.id = rr.book_id
                left join sentence_collection_settings scs on scs.reading_record_id = rr.id
                left join lateral (
                    select count(*) as cnt from sentences s where s.reading_record_id = rr.id
                ) sc on true
                left join book_reports br on br.reading_record_id = rr.id and br.is_public
                where b.isbn = :isbn and rr.status = 'COMPLETED'
                """, Map.of("isbn", isbn), (rs, rowNum) -> new Counts(
                rs.getLong("completer_count"),
                rs.getLong("public_collection_count"),
                rs.getLong("public_book_report_count")));
    }

    public List<EntryRow> findEntries(String isbn, int limit, long offset) {
        MapSqlParameterSource params = entryParams(isbn)
                .addValue("limit", limit)
                .addValue("offset", offset);
        return jdbc.query(ENTRY_SELECT + ENTRY_FROM + """
                order by rr.completed_at desc nulls last, rr.id desc
                limit :limit offset :offset
                """, params, ENTRY_MAPPER);
    }

    public long countEntries(String isbn) {
        Long count = jdbc.queryForObject("select count(*) " + ENTRY_FROM, entryParams(isbn), Long.class);
        return count == null ? 0 : count;
    }

    public Optional<EntryRow> findEntry(String isbn, Long readingRecordId) {
        MapSqlParameterSource params = entryParams(isbn).addValue("readingRecordId", readingRecordId);
        return jdbc.query(ENTRY_SELECT + ENTRY_FROM + " and rr.id = :readingRecordId", params, ENTRY_MAPPER)
                .stream().findFirst();
    }

    /**
     * 회차마다 쪽 번호가 앞선 문장부터 {@code perRecord}개까지 가져온다.
     */
    public List<PreviewSentenceRow> findPreviewSentences(Collection<Long> readingRecordIds, int perRecord) {
        if (readingRecordIds.isEmpty()) {
            return List.of();
        }
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("ids", readingRecordIds)
                .addValue("perRecord", perRecord);
        return jdbc.query("""
                select reading_record_id, id, content, page_number
                from (
                    select s.reading_record_id, s.id, s.content, s.page_number,
                           row_number() over (
                               partition by s.reading_record_id
                               order by s.page_number asc nulls last, s.created_at, s.id
                           ) as rn
                    from sentences s
                    where s.reading_record_id in (:ids)
                ) ranked
                where rn <= :perRecord
                order by reading_record_id, rn
                """, params, CommunityQueryRepository::toPreviewSentence);
    }

    private static MapSqlParameterSource entryParams(String isbn) {
        return new MapSqlParameterSource()
                .addValue("isbn", isbn)
                .addValue("previewLength", BOOK_REPORT_PREVIEW_LENGTH);
    }

    private static PreviewSentenceRow toPreviewSentence(ResultSet rs, int rowNum) throws SQLException {
        return new PreviewSentenceRow(rs.getLong("reading_record_id"), rs.getLong("id"),
                rs.getString("content"), rs.getObject("page_number", Integer.class));
    }

    private static LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp != null ? timestamp.toLocalDateTime() : null;
    }

    public record Counts(long completerCount, long publicCollectionCount, long publicBookReportCount) {
    }

    /**
     * {@code sentenceCount}가 null이면 모음집이 비공개이거나 비어 있고, {@code bookReportId}가 null이면 독후감이 비공개이거나 없다.
     */
    public record EntryRow(Long readingRecordId, int round, LocalDateTime startedAt, LocalDateTime completedAt,
                           Long userId, String nickname, Long sentenceCount,
                           Long bookReportId, String bookReportPreview, Integer bookReportLength) {
    }

    public record PreviewSentenceRow(Long readingRecordId, Long sentenceId, String content, Integer pageNumber) {
    }
}
