package com.chaekdami.dday.infrastructure;

import com.chaekdami.dday.domain.DdayRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DdayRecordRepository extends JpaRepository<DdayRecord, Long> {

    List<DdayRecord> findAllByUserIdOrderByRecordDateAsc(Long userId);

    Optional<DdayRecord> findByUserIdAndRecordDate(Long userId, LocalDate recordDate);

    @Modifying(flushAutomatically = true)
    @Query("delete from DdayRecord r where r.userId = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
