> 상태: done · 작성: 2026-11-25 · 기준: feature/be3-community-report@18c811c · 담당: BE3 · 승인: BE3
> 요구사항: [requirements.md](./requirements.md)

# 012 · 공개 독후감·문장의 신고와 블라인드 — Design

## ① 흐름

```
신고: POST /api/book-reports/{id}/reports, POST /api/sentences/{id}/reports ─▶ CommunityReportService (한 트랜잭션)
  1. 사유·상세 검사 (한줄평과 같음, 400)                                              R1.2
  2. 볼 수 있는 글인지 SQL 하나로 확인 → 아니면 404                                     R1.5
     (공개 · 안 가려짐 · 완독 회차 · 작성자 정지 아님 · 신고자가 같은 ISBN 완독)
  3. 내 글이면 400                                                                    R1.4
  4. ReportQuota: 신고자 행 잠금 → 신고 저장(이미 있으면 409)
     → 한줄평·독후감·문장의 오늘 신고 합계가 20을 넘으면 429, 저장 롤백                 R1.3, R1.6, R1.7
  5. 신고 수 증가와 자동 블라인드 (UPDATE 한 문장)                                     R2.1, R2.7

조회: 커뮤니티·공개 한줄평 쿼리에 "안 가려짐"과 "작성자 정지 아님" 조건 추가              R2.2~R2.4, R4
관리자: /api/admin/book-reports/..., /api/admin/sentences/... ─▶ CommunityAdminService  R3
```

## ② 바뀌는 것

| 구분 | 변경 | 관련 R |
|---|---|---|
| API | `POST /api/book-reports/{bookReportId}/reports`, `POST /api/sentences/{sentenceId}/reports` (요청은 한줄평 신고와 같음, 201 본문 없음) | R1 |
| API | `GET /api/admin/book-reports/reported`, `GET /api/admin/sentences/reported` (`blinded`·`page`·`size`), `PATCH /api/admin/book-reports/{id}/blind`, `PATCH /api/admin/sentences/{id}/blind` (`{"blinded": true}`) | R3 |
| API | 내 독후감·내 문장·모음집 문장 응답에 `isBlinded` 추가 (커뮤니티 상세의 문장에도 나오며 항상 false) | R2.5 |
| API | 오류 `400 CANNOT_REPORT_OWN_CONTENT` 추가. `ALREADY_REPORTED` 메시지를 "이미 신고한 글입니다."로 바꿈 (코드는 그대로) | R1.3, R1.4 |
| DB | `book_reports`·`sentences`에 `report_count`(NOT NULL DEFAULT 0), `is_blinded`(NOT NULL DEFAULT false), `blinded_at`(NULL 허용) 추가 | R2 |
| DB | 테이블 `book_report_reports`, `sentence_reports` 추가. 글+회원 UNIQUE, 글이 지워지면 함께 삭제되는 FK (`review_reports`와 같은 모양) | R1, R5.1 |
| 비즈니스 규칙 | 하루 신고 20번을 세 종류 합계로 셈. 정지 중인 회원의 독후감·문장·한줄평을 숨김. 별점 통계·완독자 수는 그대로 | R1.6, R4 |

- **기존 DB**: 새 컬럼은 `@ColumnDefault`로 DB 기본값을 함께 만든다. 이미 있는 행은 기본값으로 채워지고, 새 컬럼을 모르는 이전 코드가 같은 DB에 저장해도 실패하지 않는다. 따로 실행할 SQL은 없다 (`ddl-auto=update`). PostgreSQL에서 실제로 추가되는지는 병합 전에 사람이 확인한다.
- **신고 수·블라인드 컬럼**은 한줄평처럼 원자적 UPDATE로만 바꾸고 JPA 수정에서는 쓰지 않는다 (`updatable = false`). 그래서 작성자가 글을 고쳐도 블라인드가 유지된다 (R2.6).
- **정지 판단**은 회원 도메인과 같은 기준(`status = SUSPENDED`이고 끝 시각이 없거나 지금보다 뒤)과 같은 시각(`LocalDateTime.now()`)을 쓴다 (R4.3).
- **`@DynamicUpdate` 아님**: 위 컬럼만 빼면 충분하다.
- 커뮤니티 SQL의 `LATERAL`을 같은 결과의 상관 서브쿼리로 바꾼다. 문장 수에서 가려진 문장을 빼야 해서 어차피 고치는 곳이고, 바꾸면 H2로 실제 SQL을 테스트할 수 있다.
- 탈퇴한 신고자의 신고 행은 한줄평과 같이 지우고, 글의 신고 수는 그대로 둔다 (R5.2).
- 좋아요 취소는 지금처럼 글이 보이는지 확인하지 않는다 (R4.5).

## ③ 수정할 파일

| 파일 | 변경 내용 |
|---|---|
| `backend/src/main/java/com/chaekdami/review/domain/BookReport.java` | 신고 수·블라인드 컬럼 |
| `backend/src/main/java/com/chaekdami/review/domain/Sentence.java` | 신고 수·블라인드 컬럼 |
| `backend/src/main/java/com/chaekdami/review/domain/BookReportReport.java` | 새 파일. 독후감 신고 |
| `backend/src/main/java/com/chaekdami/review/domain/SentenceReport.java` | 새 파일. 문장 신고 |
| `backend/src/main/java/com/chaekdami/review/domain/ReviewErrorCode.java` | `CANNOT_REPORT_OWN_CONTENT`, 메시지 |
| `backend/src/main/java/com/chaekdami/review/infrastructure/BookReportRepository.java` | 신고 수·블라인드 UPDATE, 관리자 목록 |
| `backend/src/main/java/com/chaekdami/review/infrastructure/SentenceRepository.java` | 위와 같음, 안 가려진 문장 조회 |
| `backend/src/main/java/com/chaekdami/review/infrastructure/BookReportReportRepository.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/review/infrastructure/SentenceReportRepository.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/review/infrastructure/ReviewRepository.java` | 공개 목록에서 정지 회원 제외 |
| `backend/src/main/java/com/chaekdami/review/infrastructure/CommunityQueryRepository.java` | 가려진 글·정지 회원 제외, 신고할 수 있는 글 확인, 상관 서브쿼리 |
| `backend/src/main/java/com/chaekdami/review/infrastructure/UserRepositorySuspensionReader.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/review/application/port/UserSuspensionReader.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/review/application/ReportQuota.java` | 새 파일. 회원 잠금과 하루 합계 |
| `backend/src/main/java/com/chaekdami/review/application/ReportRules.java` | 새 파일. 사유·상세 검사 (한줄평과 공용) |
| `backend/src/main/java/com/chaekdami/review/application/CommunityReportService.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/review/application/CommunityAdminService.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/review/application/ReviewSocialService.java` | `ReportQuota`·`ReportRules` 사용, 정지 회원 숨김 |
| `backend/src/main/java/com/chaekdami/review/application/CommunityService.java` | 안 가려진 문장만 |
| `backend/src/main/java/com/chaekdami/review/application/ReviewCleanupService.java` | 탈퇴한 신고자의 신고 삭제 |
| `backend/src/main/java/com/chaekdami/review/application/SentenceCollectionAssembler.java` | `isBlinded` |
| `backend/src/main/java/com/chaekdami/review/application/result/BookReportResult.java` | `isBlinded` |
| `backend/src/main/java/com/chaekdami/review/application/result/SentenceResult.java` | `isBlinded` |
| `backend/src/main/java/com/chaekdami/review/application/result/SentenceCollectionBody.java` | `isBlinded` |
| `backend/src/main/java/com/chaekdami/review/application/result/AdminBookReportResult.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/review/application/result/AdminSentenceResult.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/review/presentation/CommunityReportController.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/review/presentation/CommunityAdminController.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/review/presentation/dto/BookReportResponse.java` | `isBlinded` |
| `backend/src/main/java/com/chaekdami/review/presentation/dto/SentenceResponse.java` | `isBlinded` |
| `backend/src/test/java/com/chaekdami/review/` | 새 `CommunityReportTest`(H2), 생성자·메서드 변경에 맞춘 기존 테스트 |
| `backend/src/test/java/com/chaekdami/connection/OpenInViewOffApiTest.java` | 커뮤니티 API 포함 |
| `backend/http/review.http` | 요청 예시 |

## ④ 고칠 docs 문서

- [x] `docs/domains/review/api.md` — 신고·관리자 API, `isBlinded`, 오류
- [x] `docs/domains/review/data.md` — 컬럼, 새 테이블, 삭제
- [x] `docs/domains/review/rules.md` — 신고·블라인드·정지 회원 규칙
- [x] `docs/domains/review/overview.md` — 기능, review → user 연결
- [x] `docs/domains/user/rules.md` — 정지 중 글 숨김
- [x] `docs/conventions/testing.md` — 커뮤니티 H2 설명이 있으면 고침
- [ ] `docs/known-issues.md` — 병합 뒤 TODO-35를 남은 앱 작업으로 고침 (main에서)

## ⑤ 남은 질문 (❓)

- 없음

---

## 변경 기록

| 날짜 | 바뀐 내용 | 이유 | 결정 |
|---|---|---|---|
| | | | |
