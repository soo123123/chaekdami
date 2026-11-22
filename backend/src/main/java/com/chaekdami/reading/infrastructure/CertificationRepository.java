package com.chaekdami.reading.infrastructure;

import com.chaekdami.reading.domain.Certification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CertificationRepository extends JpaRepository<Certification, Long> {

    // 한 회차의 인증 목록 (최근 것 먼저)
    List<Certification> findAllByReadingRecordIdOrderByIdDesc(Long readingRecordId);

    // 재사용 검사용: 내 최근 인증 50개
    List<Certification> findTop50ByUserIdOrderByIdDesc(Long userId);

    // 서재에서 책을 지울 때 함께 삭제
    void deleteAllByReadingRecordBookId(Long bookId);
}
