package com.chaekdami.review.infrastructure;

import com.chaekdami.review.domain.Sentence;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface SentenceRepository extends JpaRepository<Sentence, Long> {

    List<Sentence> findAllByReadingRecordIdOrderByCreatedAtDescIdDesc(Long readingRecordId);

    List<Sentence> findAllByReadingRecordId(Long readingRecordId);

    List<Sentence> findAllByReadingRecordIdIn(Collection<Long> readingRecordIds);

    @Query(value = """
            select s.readingRecordId as readingRecordId, count(s) as sentenceCount, max(s.readDate) as lastReadDate
            from Sentence s
            where s.userId = :userId
            group by s.readingRecordId
            order by max(s.readDate) desc, max(s.id) desc
            """,
            countQuery = "select count(distinct s.readingRecordId) from Sentence s where s.userId = :userId")
    Page<CollectionStats> findCollectionStats(@Param("userId") Long userId, Pageable pageable);

    @Query(value = """
            select s.readingRecordId as readingRecordId, count(s) as sentenceCount, max(s.readDate) as lastReadDate
            from Sentence s
            where s.userId = :userId and s.bookId = :bookId
            group by s.readingRecordId
            order by max(s.readDate) desc, max(s.id) desc
            """,
            countQuery = """
                    select count(distinct s.readingRecordId) from Sentence s
                    where s.userId = :userId and s.bookId = :bookId
                    """)
    Page<CollectionStats> findCollectionStatsByBook(@Param("userId") Long userId, @Param("bookId") Long bookId,
                                                    Pageable pageable);

    @Modifying
    @Query("delete from Sentence s where s.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("delete from Sentence s where s.bookId = :bookId")
    int deleteAllByBookId(@Param("bookId") Long bookId);

    interface CollectionStats {

        Long getReadingRecordId();

        long getSentenceCount();

        LocalDate getLastReadDate();
    }
}
