package com.chaekdami.review.infrastructure;

import com.chaekdami.review.domain.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByBookId(Long bookId);

    @Query("""
            select r from Review r
            where r.isbn = :isbn and r.isPublic = true and r.isBlinded = false and r.oneLine is not null
            """)
    Page<Review> findPublicByIsbn(@Param("isbn") String isbn, Pageable pageable);

    @Query("""
            select r.rating as rating, count(r) as count
            from Review r
            where r.isbn = :isbn and r.isBlinded = false
            group by r.rating
            """)
    List<RatingCount> countRatingsByIsbn(@Param("isbn") String isbn);

    @Query("""
            select r from Review r
            where (r.reportCount > 0 or r.isBlinded = true)
              and (:blinded is null or r.isBlinded = :blinded)
            """)
    Page<Review> findReported(@Param("blinded") Boolean blinded, Pageable pageable);

    @Query("select r.likeCount from Review r where r.id = :reviewId")
    int findLikeCount(@Param("reviewId") Long reviewId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "update reviews set like_count = like_count + 1 where id = :reviewId", nativeQuery = true)
    int incrementLikeCount(@Param("reviewId") Long reviewId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "update reviews set like_count = like_count - 1 where id = :reviewId and like_count > 0",
            nativeQuery = true)
    int decrementLikeCount(@Param("reviewId") Long reviewId);

    /**
     * 신고 수 증가와 임계값 도달 시 블라인드를 한 문장으로 처리한다. SET의 우변은 갱신 전 값을 본다.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            update reviews
            set report_count = report_count + 1,
                is_blinded = is_blinded or report_count + 1 >= :threshold,
                blinded_at = case when not is_blinded and report_count + 1 >= :threshold
                                  then :now else blinded_at end
            where id = :reviewId
            """, nativeQuery = true)
    int addReport(@Param("reviewId") Long reviewId, @Param("threshold") int threshold,
                  @Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "update reviews set is_blinded = false, blinded_at = null, report_count = 0 where id = :reviewId",
            nativeQuery = true)
    int unblind(@Param("reviewId") Long reviewId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "update reviews set is_blinded = true, blinded_at = :now where id = :reviewId and not is_blinded",
            nativeQuery = true)
    int blind(@Param("reviewId") Long reviewId, @Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            update reviews
            set like_count = greatest(like_count - 1, 0)
            where id in (select review_id from review_likes where user_id = :userId)
            """, nativeQuery = true)
    int decrementLikesGivenBy(@Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Review r where r.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from Review r where r.bookId = :bookId")
    int deleteAllByBookId(@Param("bookId") Long bookId);

    interface RatingCount {

        short getRating();

        long getCount();
    }
}
