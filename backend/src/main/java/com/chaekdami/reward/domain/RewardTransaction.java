package com.chaekdami.reward.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 재화/경험치 변동 이력 (insert-only)
 * reference_id 는 어떤 대상에 대한 지급인지 남긴다. (예: 독서 완료 보상의 독서 세션 id)
 * 같은 대상에 같은 종류/사유로 두 번 지급되지 않도록 UNIQUE 를 건다. reference_id 가 null 인 행은 제약을 받지 않는다.
 */
@Getter
@Entity
@Table(
        name = "reward_transactions",
        indexes = @Index(name = "idx_reward_transactions_user_id", columnList = "user_id"),
        uniqueConstraints = @UniqueConstraint(
                name = "uk_reward_transactions_user_id_type_reason_reference_id",
                columnNames = {"user_id", "type", "reason", "reference_id"}
        )
)
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RewardTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private TransactionType type;

    @Column(name = "amount", nullable = false)
    private Integer amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false, length = 30)
    private TransactionReason reason;

    @Column(name = "reference_id")
    private Long referenceId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    private RewardTransaction(Long userId, TransactionType type, Integer amount, TransactionReason reason,
                              Long referenceId) {
        this.userId = userId;
        this.type = type;
        this.amount = amount;
        this.reason = reason;
        this.referenceId = referenceId;
    }
}
