> 상태: in-progress (2026-11-22 승인, 구현·docs 완료, 사람 확인 남음) · 작성: 2026-11-22 · 기준: main@82df578 (+ 스펙 004 작업) · 담당: BE1 · 승인: BE1, BE3, FE1
> 요구사항: [requirements.md](./requirements.md)

# 003 · 세션 문장 저장과 삭제 데이터 정리 — Design

## ① 흐름

```
[독서 종료 저장] readingApi.saveReadingRecord (FE1)
  │  완독한 책이면 새 회차 먼저 생성 (지금 그대로)
  └─ POST /api/reading-sessions { bookId, readingTime, startPage, endPage, sentence, photoVerificationId }
        ReadingSessionService.create   ── 한 트랜잭션 ──────────────────────────────┐
          1. 회차 찾기, 세션 저장, 현재 페이지 갱신 (지금 그대로)                     │
          2. 인증 연결 (스펙 004, 지금 그대로)                                         │
          3. SessionSentenceRecorder.record(userId, recordId, sentence, endPage)  ← 새 port │
               └ (review) SentenceService.recordFromSession                           │
                    빈 문장 → 건너뜀 / 규칙 위반 → InvalidRequestException → 전체 롤백  │
     ◀── 201 세션 응답 (지금 그대로)  /  400 VALIDATION_ERROR (아무것도 저장 안 됨) ◀──┘
  앱: 문장 API를 따로 부르지 않음. 실패 시 "다시 시도하기"는 같은 요청 재전송

[책 삭제] DELETE /api/books/{id}
        BookService.deleteBook   ── 한 트랜잭션
          0. BookActivityCleaner.deleteAllOfBook(bookId)   ← 새 port
               └ (review) ReviewCleanupService.deleteAllOfBook (좋아요·신고 → 리뷰 → 독후감 → 문장)
          1. 인증 → 세션 → 회차 → 책 (지금 그대로)

[회원 탈퇴] UserService.withdraw → UserWithdrawnEvent (같은 트랜잭션)
        ReadingCleanupListener (새) → ReadingCleanupService.deleteAllOfUser(userId)
          인증 → 세션 → 회차 → 책
        (review·reward·dday 리스너는 지금 그대로)
```

## ② 바뀌는 것

| 구분 | 변경 | 관련 R |
|---|---|---|
| API | `POST /api/reading-sessions`의 `sentence`를 **실제로 저장**. 규칙 위반이면 400 `VALIDATION_ERROR` (`InvalidRequestException` → `GlobalExceptionHandler`). 요청·응답 모양은 그대로 | R1 |
| API (앱) | 앱이 독서 종료 때 `POST /api/reading-records/{id}/sentences`를 더 이상 부르지 않음 (API 자체는 그대로, 문장 모음 화면 등에서 계속 씀) | R2.1 |
| DB | 없음 | |
| 비즈니스 규칙 | 세션·인증 연결·문장을 한 트랜잭션으로 저장 | R1.5 |
| 비즈니스 규칙 | 세션 문장의 쪽 번호 = `endPage` (1 미만이면 없음) | R1.2 |
| 비즈니스 규칙 | 책 삭제 시 그 책의 문장·리뷰·독후감·리뷰 좋아요·신고도 삭제 | R3 |
| 비즈니스 규칙 | 탈퇴 시 reading 데이터(인증·세션·회차·책) 삭제 | R4 |

### 도메인 연결 방식

[architecture.md](../../architecture.md#3-도메인끼리-연결)의 원칙대로 **port**로 연결한다 (reward → reading과 같은 모양).

| port (reading/application/port) | 구현 (review/infrastructure) | 부르는 곳 |
|---|---|---|
| `SessionSentenceRecorder.record(userId, readingRecordId, sentence, pageNumber)` | `SentenceServiceSessionSentenceRecorder` → `SentenceService.recordFromSession` | `ReadingSessionService.create` |
| `BookActivityCleaner.deleteAllOfBook(bookId)` | `ReviewBookActivityCleaner` → `ReviewCleanupService.deleteAllOfBook` | `BookService.deleteBook` |

- 둘 다 같은 트랜잭션에 참여한다 (`@Transactional` 기본 전파). review 쪽 예외는 그대로 위로 올려 전체를 롤백한다.
- `recordFromSession`은 회차 소유 확인을 JDBC(`JdbcReadingRecordReader`)로 한다. 같은 트랜잭션·같은 연결이고, 회차·세션은 `IDENTITY`라 저장 즉시 INSERT되므로 새로 만든 회차도 보인다.

### 세션 저장 순서

1. 지금처럼 필수값·3분 규칙 확인 → 회차 → 세션 저장 → 인증 연결
2. 문장 저장 (`sentence`가 비어 있으면 port가 아무것도 안 함)
3. 2에서 예외 → 1까지 전부 롤백. 앱은 400을 받고, 사진 인증 번호는 연결되지 않은 채 남아 다시 쓸 수 있다 (R1.5)

`sentence`를 받기만 하던 DTO 주석("아직 저장하지 않음")을 고친다.

### 탈퇴 정리

- `ReadingCleanupService.deleteAllOfUser(userId)` (reading/application): `certificationRepository.deleteAllByUserId` → `readingSessionRepository.deleteAllByUserId` → `readingRecordRepository.deleteAllByUserId` → `bookRepository.deleteAllByUserId`
- `ReadingCleanupListener` (reading/infrastructure): `@EventListener UserWithdrawnEvent` — 기존 리스너와 같은 모양, 같은 트랜잭션 (R4.2)
- 리스너끼리 순서는 상관없다 (review는 문장 등 자기 테이블만, reward는 보상 테이블만 지운다).

### 앱 (FE1)

`readingApi.saveReadingRecord`:
- 세션 요청 본문에 `sentence: request.sentence?.trim()`을 넣는다 (비어 있으면 빼도 됨).
- 세션 저장 뒤 `POST /api/reading-records/{id}/sentences` 호출을 지운다.
- 응답(`ReadingRecordResult`)과 화면은 그대로.

배포 순서: 서버 먼저 (R2.3). 서버만 바뀐 상태에서 옛 앱은 `sentence`를 안 보내므로 문장이 두 번 저장되지 않는다. 앱만 먼저 바뀌면 문장이 저장되지 않으니 순서를 지킨다.

## ③ 수정할 파일

| 파일 | 변경 내용 | R |
|---|---|---|
| `backend/.../reading/application/port/SessionSentenceRecorder.java` (새) | port | R1 |
| `backend/.../reading/application/port/BookActivityCleaner.java` (새) | port | R3 |
| `backend/.../review/infrastructure/SentenceServiceSessionSentenceRecorder.java` (새) | port 구현 | R1 |
| `backend/.../review/infrastructure/ReviewBookActivityCleaner.java` (새) | port 구현 | R3 |
| `backend/.../reading/application/ReadingSessionService.java` | 세션 저장 뒤 문장 저장 | R1.1~R1.5 |
| `backend/.../reading/presentation/dto/request/CreateReadingSessionRequest.java` | `sentence` 주석 | R1 |
| `backend/.../reading/application/BookService.java` | 삭제 전 독후활동 정리 | R3 |
| `backend/.../reading/application/ReadingCleanupService.java` (새) | 사용자 reading 데이터 삭제 | R4.1 |
| `backend/.../reading/infrastructure/ReadingCleanupListener.java` (새) | 탈퇴 이벤트 받기 | R4.2 |
| `backend/.../reading/infrastructure/{Certification,ReadingSession,ReadingRecord,Book}Repository.java` | `deleteAllByUserId` | R4.1 |
| `backend/src/test/...` | `ReadingSessionServiceTest`(문장 저장·빈 문장·규칙 위반 시 예외 전파), `ReadingSessionControllerTest`(규칙 위반 400), `BookService` 삭제 순서, `ReadingCleanupService` 삭제 순서 | R1, R3, R4 |
| `frontend/src/features/fe1/api/readingApi.ts` | 세션 요청에 `sentence`, 문장 API 호출 제거 | R2.1 |

`ReviewCleanupService`, `SentenceService`는 고치지 않는다 (이미 있는 메서드를 port로 부르기만 한다).

## ④ 고칠 docs 문서

- [x] `docs/domains/reading/api.md` — `POST /api/reading-sessions`의 `sentence`(저장됨, 쪽 번호 = `endPage`, 400), ISSUE-BUG-1·2 표시 제거
- [x] `docs/domains/reading/rules.md` — 세션 저장 규칙(문장 함께 저장, 한 트랜잭션)
- [x] `docs/domains/reading/data.md` — 삭제 표 (책 삭제 시 독후활동, 탈퇴 시 reading 데이터)
- [x] `docs/domains/review/*` — 세션 저장으로 문장이 만들어짐, 책 삭제 시 정리가 실제로 불림
- [x] `docs/architecture.md` — 새 port 2개, `ReadingCleanupListener`, ISSUE-DATA-2 표시 제거
- [x] `docs/known-issues.md` — ISSUE-BUG-1·BUG-2·DATA-1·DATA-2 해결. 새 문제: 응답만 끊긴 뒤 다시 시도하면 세션 2건 (R5.2)
- [x] `docs/specs/README.md` — 003 상태

## ⑤ 남은 질문 (❓)

- 없음.

---

## 변경 기록

| 날짜 | 바뀐 내용 | 이유 | 결정 |
|---|---|---|---|
| | | | |
