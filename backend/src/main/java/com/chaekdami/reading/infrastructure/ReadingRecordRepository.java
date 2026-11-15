package com.chaekdami.reading.infrastructure;

import com.chaekdami.reading.domain.ReadingRecord;
import com.chaekdami.reading.domain.ReadingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReadingRecordRepository extends JpaRepository<ReadingRecord, Long> {

    // 내 모든 기록 (서재 목록에서 책별 최근 회차를 고를 때 사용)
    List<ReadingRecord> findAllByUserId(Long userId);

    // 내 기록만 조회 (남의 기록이면 결과 없음 → 404)
    Optional<ReadingRecord> findByIdAndUserId(Long id, Long userId);

    // 책의 회차별 기록 (최신 회차 먼저)
    List<ReadingRecord> findAllByBookIdOrderByRoundDesc(Long bookId);

    // 가장 최근 회차 (새 회차 번호 계산용)
    Optional<ReadingRecord> findFirstByBookIdOrderByRoundDesc(Long bookId);

    // 아직 끝나지 않은 회차가 있는지 (있으면 새 회차 시작 불가)
    boolean existsByBookIdAndStatusNot(Long bookId, ReadingStatus status);

    // 서재에서 책을 지울 때 기록도 함께 삭제
    void deleteAllByBookId(Long bookId);
}
