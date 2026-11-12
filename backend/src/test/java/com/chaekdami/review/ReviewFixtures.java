package com.chaekdami.review;

import com.chaekdami.review.application.port.BookView;
import com.chaekdami.review.application.port.ReadingRecordView;
import com.chaekdami.review.domain.Sentence;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public final class ReviewFixtures {

    private ReviewFixtures() {
    }

    public static void signIn(Long userId) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                userId, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
    }

    public static ReadingRecordView record(Long id, Long userId, Long bookId, String status) {
        return record(id, userId, bookId, status, false);
    }

    public static ReadingRecordView record(Long id, Long userId, Long bookId, String status, boolean isPublic) {
        LocalDateTime completedAt = "COMPLETED".equals(status) ? LocalDateTime.of(2026, 10, 20, 22, 0) : null;
        return new ReadingRecordView(id, userId, bookId, 1, status, isPublic,
                LocalDateTime.of(2026, 10, 1, 20, 0), completedAt);
    }

    public static BookView book(Long id, Long userId, String isbn, Integer totalPages) {
        return new BookView(id, userId, "아주 작은 습관의 힘", "제임스 클리어", "https://cover", isbn, totalPages);
    }

    public static Sentence sentence(Long id, Long userId, Long readingRecordId, LocalDate readDate,
                                    Integer pageNumber, String content) {
        Sentence sentence = Sentence.builder()
                .userId(userId)
                .readingRecordId(readingRecordId)
                .bookId(7L)
                .readDate(readDate)
                .pageNumber(pageNumber)
                .content(content)
                .build();
        ReflectionTestUtils.setField(sentence, "id", id);
        ReflectionTestUtils.setField(sentence, "createdAt", readDate.atTime(21, 0).plusSeconds(id));
        ReflectionTestUtils.setField(sentence, "updatedAt", readDate.atTime(21, 0).plusSeconds(id));
        return sentence;
    }
}
