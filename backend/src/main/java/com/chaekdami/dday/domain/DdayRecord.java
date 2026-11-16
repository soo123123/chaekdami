package com.chaekdami.dday.domain;

import com.chaekdami.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Entity
@Table(
        name = "dday_records",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_dday_records_user_id_record_date",
                columnNames = {"user_id", "record_date"}
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DdayRecord extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DdayRecordStatus status;

    public static DdayRecord create(Long userId, LocalDate recordDate, DdayRecordStatus status) {
        DdayRecord record = new DdayRecord();
        record.userId = userId;
        record.recordDate = recordDate;
        record.status = status;
        return record;
    }

    public void changeStatus(DdayRecordStatus status) {
        this.status = status;
    }
}
