package com.chaekdami.review.infrastructure;

import com.chaekdami.review.domain.ReviewLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {

    @Modifying(flushAutomatically = true)
    @Query(value = """
            insert into review_likes (review_id, user_id, created_at)
            values (:reviewId, :userId, :now)
            on conflict (review_id, user_id) do nothing
            """, nativeQuery = true)
    int insertIfAbsent(@Param("reviewId") Long reviewId, @Param("userId") Long userId,
                       @Param("now") LocalDateTime now);

    @Modifying(flushAutomatically = true)
    @Query("delete from ReviewLike l where l.review.id = :reviewId and l.userId = :userId")
    int deleteByReviewIdAndUserId(@Param("reviewId") Long reviewId, @Param("userId") Long userId);

    @Query("select l.review.id from ReviewLike l where l.userId = :userId and l.review.id in :reviewIds")
    List<Long> findLikedReviewIds(@Param("userId") Long userId, @Param("reviewIds") Collection<Long> reviewIds);

    boolean existsByReview_IdAndUserId(Long reviewId, Long userId);

    @Modifying(flushAutomatically = true)
    @Query("delete from ReviewLike l where l.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);

    @Modifying(flushAutomatically = true)
    @Query("delete from ReviewLike l where l.review.id in (select r.id from Review r where r.userId = :userId)")
    int deleteAllOnReviewsOf(@Param("userId") Long userId);

    @Modifying(flushAutomatically = true)
    @Query("delete from ReviewLike l where l.review.id in (select r.id from Review r where r.bookId = :bookId)")
    int deleteAllOnBook(@Param("bookId") Long bookId);
}
