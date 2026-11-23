package com.chaekdami.reading.infrastructure;

import com.chaekdami.reading.domain.Certification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CertificationRepository extends JpaRepository<Certification, Long> {

    // 한 회차의 인증 목록 (최근 것 먼저)
    List<Certification> findAllByReadingRecordIdOrderByIdDesc(Long readingRecordId);

    // 세션 저장 때 연결할 내 인증 (남의 인증은 찾지 않음)
    Optional<Certification> findByIdAndUserId(Long id, Long userId);

    // 보상 확인용: 이 세션에 연결된 내 인증 (reading_session_id가 UNIQUE라 최대 1개)
    Optional<Certification> findByUserIdAndReadingSessionId(Long userId, Long readingSessionId);

    // 재사용 검사용: 내 최근 인증 50개
    List<Certification> findTop50ByUserIdOrderByIdDesc(Long userId);

    // 서재에서 책을 지울 때 함께 삭제
    void deleteAllByReadingRecordBookId(Long bookId);

    // 회원 탈퇴 때 그 사용자의 인증 전부 삭제 (스펙 003 R4)
    void deleteAllByUserId(Long userId);
}
