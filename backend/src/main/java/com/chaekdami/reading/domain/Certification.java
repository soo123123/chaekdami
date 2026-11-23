package com.chaekdami.reading.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

// 독서 인증: 책 페이지 사진에서 AI로 글자를 추출하고 검증한 결과
@Entity
@Table(
        name = "certifications",
        indexes = {
                @Index(name = "idx_certifications_reading_record_id", columnList = "reading_record_id"),
                @Index(name = "idx_certifications_user_id", columnList = "user_id")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Certification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reading_record_id")
    private ReadingRecord readingRecord; // 어느 회차의 인증인지

    private String imageUrl; // 사진 주소 (저장소 연결 후 채움, 지금은 null)

    @Column(columnDefinition = "TEXT")
    private String extractedText; // AI가 읽은 글자

    @Column(columnDefinition = "TEXT")
    private String normalizedText; // 공백·기호를 지운 글자 (재사용 비교용)

    private Integer detectedPage; // 사진에서 찾은 페이지 번호 (못 찾으면 null)

    private Boolean bookPage; // AI 판단: 책 페이지 사진인가 (판단 못 하면 null)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CertificationStatus status;

    @Column(length = 1000)
    private String message; // 판정 이유 (여러 개면 줄바꿈으로 구분)

    private Boolean aiSkipped; // AI 사용 한도 초과(429)로 확인 없이 통과 (null은 false로 봄: 이 칸이 생기기 전 기록)

    @Column(name = "reading_session_id", unique = true)
    private Long readingSessionId; // 이 인증을 쓴 독서 세션 (세션 저장 때 연결, 한 세션에 하나)

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static Certification of(ReadingRecord record, String extractedText, String normalizedText,
                                   Integer detectedPage, Boolean bookPage,
                                   CertificationStatus status, String message, boolean aiSkipped) {
        Certification c = new Certification();
        c.userId = record.getUserId();
        c.readingRecord = record;
        c.extractedText = extractedText;
        c.normalizedText = normalizedText;
        c.detectedPage = detectedPage;
        c.bookPage = bookPage;
        c.status = status;
        c.message = message;
        c.aiSkipped = aiSkipped;
        return c;
    }

    public boolean isAiSkipped() {
        return Boolean.TRUE.equals(aiSkipped);
    }

    // 사진 인증 추가 보상 대상인가: 통과했고, AI가 실제로 확인한 인증 (429로 확인 없이 통과한 것은 제외, 임시 규칙)
    public boolean isRewardable() {
        return status == CertificationStatus.PASSED && !isAiSkipped();
    }

    // 아직 어느 세션에도 쓰이지 않은 통과 인증인가
    public boolean isLinkableToSession() {
        return status == CertificationStatus.PASSED && readingSessionId == null;
    }

    // 독서 세션에 연결 (세션 저장 때). 이미 쓰였거나 통과하지 못한 인증이면 예외
    public void linkSession(Long sessionId) {
        if (!isLinkableToSession()) {
            throw new IllegalStateException("세션에 연결할 수 없는 인증입니다: " + id);
        }
        this.readingSessionId = sessionId;
    }
}
