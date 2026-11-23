package com.chaekdami.reading.infrastructure;

import com.chaekdami.reading.domain.Book;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {

    // 내 서재 목록 (최근 등록순)
    List<Book> findAllByUserIdOrderByIdDesc(Long userId);

    // 내 책만 조회 (남의 bookId로 접근하면 결과 없음 → 404)
    Optional<Book> findByIdAndUserId(Long id, Long userId);

    // 이 YES24 책을 이미 내 서재에 담았는지 확인
    boolean existsByUserIdAndItemId(Long userId, Long itemId);

    // 회원 탈퇴 때 그 사용자의 서재 책 전부 삭제 (스펙 003 R4)
    void deleteAllByUserId(Long userId);
}
