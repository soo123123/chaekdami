> 상태: in-progress (2026-11-22 승인, 구현·docs 완료, 사람 확인 남음) · 작성: 2026-11-22 · 기준: main@82df578 · 담당: BE1 · 승인: BE1, FE1, BE2
> 요구사항: [requirements.md](./requirements.md)

# 004 · 독서 인증 앱 연결과 사진 인증 보상 — Design

## ① 흐름

```
[독서 종료 화면] 사진 붙이기 (useReadingEnd.attachPhoto)
  │  회차 번호 = 책 상세의 currentRound.readingRecordId (가장 최근 회차)
  │  사진 축소 (긴 변 1280px, JPEG)
  └─ POST /api/reading-records/{recordId}/certifications   (multipart: image 만)
        CertificationService.certify
          └─ GeminiPageTextExtractor.extract
               ├─ 성공 ───────────────▶ 글자·쪽 번호·책 페이지 여부
               ├─ 연결 실패 / 5xx ────▶ 첫 실패가 4초 안이면 1초 쉬고 1번 더 (R4.1, R4.5)
               ├─ 응답 시간 초과(30초) ▶ 다시 시도 없음 → 빈 결과 (R4.2)
               ├─ 429 ───────────────▶ 다시 시도 없음 → "AI 확인 안 함" (R4.3)
               └─ 그 밖의 실패 ────────▶ 다시 시도 없음 → 빈 결과 (R4.6)
          └─ CertificationVerifier.verify
               ├─ AI 확인 안 함 → PASSED + "AI 확인 없이 통과" (R4.3, R4.4)
               └─ 그 외 → 지금 규칙 그대로 (빈 결과면 글자 부족 → UNVERIFIED, R4.7)
          └─ certifications 저장 (ai_skipped 함께)
     ◀── { id, status, messages, ... }
  PASSED     → 사진 통과 표시, verificationId = id            (R2.1, R2.5)
  FAILED     → 사진 지움, messages 안내 (없으면 기본 문구)     (R2.2, R2.4)
  UNVERIFIED → FAILED와 같음                                   (R2.3)
  오류·45초 초과 → 사진 지움, 오류 안내                         (R3.1, R3.2)

[저장 버튼] readingApi.saveReadingRecord   (지금 그대로)
  └─ POST /api/reading-sessions { ..., photoVerificationId }
        ReadingSessionService.create
          └─ 세션 저장 후 photoVerificationId가 있으면
             내 인증 + PASSED + 아직 안 쓰임 → certifications.reading_session_id = 이 세션 (R5.1, R5.4)
             아니면 무시, 저장은 성공 (R5.2)

[독서 완료 화면] POST /api/rewards/reading-sessions/{sessionId}   (지금 그대로)
        ReadingSessionRewardService → PhotoCertificationChecker.isPhotoCertified(userId, sessionId)
          └─ (새 구현) 이 세션에 연결된 인증 중 PASSED 이고 ai_skipped 아님 이 있으면 true (R5.3)
             → +20 EXP (지금 보상 규칙 그대로)
```

## ② 바뀌는 것

| 구분 | 변경 | 관련 R |
|---|---|---|
| API | `POST /api/reading-sessions` 요청에 `photoVerificationId`(선택, 숫자) 추가. 응답은 그대로 | R1.4, R5.1 |
| API | `POST /api/reading-records/{id}/certifications` 형식은 그대로. 429일 때 `PASSED` + `messages`에 "AI 확인 없이 통과" | R4.3, R4.4 |
| API (앱) | 앱이 부르는 주소를 `POST /api/reading-photos/verify` → `POST /api/reading-records/{id}/certifications`로 바꿈 | R1.1, R6.1 |
| DB | `certifications.reading_session_id` (BIGINT, NULL 허용, UNIQUE) — 연결된 세션 | R5.1, R5.4 |
| DB | `certifications.ai_skipped` (BOOLEAN, NULL 허용, NULL은 false로 봄) — 429로 AI 확인 없이 통과 | R4.4, R5.3 |
| 비즈니스 규칙 | AI 호출: 연결 실패·5xx면 첫 실패가 4초 안일 때만 1초 뒤 1번 더. 시간 초과·그 밖의 실패는 다시 시도 없음 | R4.1, R4.2, R4.5, R4.6 |
| 비즈니스 규칙 | AI 사용 한도 초과(429)면 `PASSED` (임시) | R4.3 |
| 비즈니스 규칙 | 세션 저장 때 인증을 세션에 연결 (내 것, `PASSED`, 안 쓰인 것만) | R5.1, R5.2, R5.4 |
| 비즈니스 규칙 | 사진 인증 추가 보상: 연결된 `PASSED` 인증이 있고 `ai_skipped`가 아니면 지급 (임시: 429 통과 제외) | R5.3 |
| 비즈니스 규칙 (앱) | 사진 검증을 기다리는 시간 15초 → 45초 | R3.1 |

DB는 `spring.jpa.hibernate.ddl-auto=update`라 두 칸이 자동으로 더해진다. 기존 줄은 둘 다 NULL(연결 없음, AI 확인함)이 된다. 그래서 `ai_skipped`는 기본형 `boolean`이 아니라 `Boolean`(NULL 허용)으로 둔다.

### 서버 세부

**AI 결과에 "확인 안 함" 표시** — `PageExtraction`에 `boolean aiSkipped`를 더한다.
- `PageExtraction.skipped()` = `("", null, null, true)` — 429일 때만 쓴다.
- 기존 생성(성공, 빈 결과, Mock)은 `aiSkipped = false`.

**다시 시도** — `GeminiPageTextExtractor.extract` 안에서 호출을 최대 2번 한다.

| 실패 | 판단 | 동작 |
|---|---|---|
| `HttpClientErrorException.TooManyRequests` (429) | 한도 초과 | 바로 `PageExtraction.skipped()` |
| `HttpServerErrorException` (5xx) | 일시 오류 | 다시 시도 대상 |
| `ResourceAccessException` 중 원인이 `ConnectException`·`UnknownHostException`, 또는 connect timed out | 연결 실패 | 다시 시도 대상 |
| `ResourceAccessException` 중 원인이 `SocketTimeoutException`(Read timed out) | 응답 시간 초과 | 다시 시도 없음 → 빈 결과 |
| 그 밖 (4xx, 응답 해석 실패 등) | — | 다시 시도 없음 → 빈 결과 |

- 다시 시도 대상이어도 첫 호출 시작부터 **4초**가 지났으면 다시 시도하지 않는다 (`RETRY_WITHIN = 4s`; 4초 + 쉬기 1초 + 최대 35초 ≈ 40초).
- 쉬는 시간 `RETRY_DELAY = 1s`.
- 판단은 테스트하기 쉽게 작은 클래스로 뺀다: `GeminiRetryPolicy.classify(Throwable) → RETRY | NO_RETRY | RATE_LIMITED`, `shouldRetry(kind, elapsedMs)`.
- 사진 축소와 요청 본문 만들기는 다시 하지 않는다.

**판정** — `CertificationVerifier.verify` 맨 앞에서 `extraction.aiSkipped()`면 다른 검사 없이 `PASSED`, 메시지 `"AI 확인 없이 통과했어요. (사용 한도 초과)"`. `Certification.of(...)`에 `aiSkipped`를 넘겨 저장한다.

**세션 연결** — `ReadingSessionService.create`:
1. 지금처럼 회차를 찾고 세션을 저장한다.
2. `request.photoVerificationId()`가 있으면 `certificationRepository.findByIdAndUserId(id, userId)`.
3. 찾았고, `status == PASSED`이고, `readingSessionId == null`이면 `certification.linkSession(saved.getId())`.
4. 그 밖이면 아무것도 하지 않는다 (로그만 남김).
- 책·회차는 비교하지 않는다 (다회독 첫 세션은 회차가 다르다). 남의 인증은 2에서 걸러진다.
- `reading_session_id`는 엔티티 연관 없이 숫자 칸으로 둔다 (`reading` 안에서 세션 삭제 정리는 아래).

**보상 확인** — `reward` 쪽 임시 구현을 바꾼다.
- `reading`에 조회 메서드: `CertificationService.isPhotoCertified(userId, readingSessionId)` = `certificationRepository.existsByUserIdAndReadingSessionIdAndStatusAndAiSkippedNot...` 형태 (PASSED, `ai_skipped`가 true가 아님).
- `reward/infrastructure/PendingPhotoCertificationChecker` → `CertificationPhotoChecker`(이름 변경)로 바꾸고 위 메서드를 부른다. 포트(`PhotoCertificationChecker`)와 `ReadingSessionRewardService`는 바꾸지 않는다 (조회 실패 시 기본 보상만 주는 처리도 그대로).

**삭제 정리** — 세션이 지워지는 경로(책 삭제, 탈퇴)에서 인증도 이미 함께 지워지는지 확인하고, 세션만 지워지는 경로가 있으면 `reading_session_id`를 비운다. (현재 책 삭제 시 `deleteAllByReadingRecordBookId`로 인증도 함께 삭제)

## ③ 수정할 파일

| 파일 | 변경 내용 | R |
|---|---|---|
| `backend/.../reading/infrastructure/ai/PageExtraction.java` | `aiSkipped` 칸, `skipped()` | R4.3 |
| `backend/.../reading/infrastructure/ai/GeminiRetryPolicy.java` (새 파일) | 실패 분류·다시 시도 판단 | R4.1, R4.2, R4.5, R4.6 |
| `backend/.../reading/infrastructure/ai/GeminiPageTextExtractor.java` | 최대 2번 호출, 429 → `skipped()` | R4.1~R4.6 |
| `backend/.../reading/infrastructure/ai/MockPageTextExtractor.java` | `PageExtraction` 칸 추가에 맞춤 | — |
| `backend/.../reading/application/CertificationVerifier.java` | `aiSkipped`면 `PASSED` + 안내 문구 | R4.3, R4.4 |
| `backend/.../reading/domain/Certification.java` | `readingSessionId`(UNIQUE), `aiSkipped` 칸, `linkSession(Long)` | R4.4, R5.1, R5.4 |
| `backend/.../reading/infrastructure/CertificationRepository.java` | `findByIdAndUserId`, 보상 확인용 `exists...` | R5.1, R5.3 |
| `backend/.../reading/application/CertificationService.java` | `aiSkipped` 저장, `isPhotoCertified` | R4.4, R5.3 |
| `backend/.../reading/presentation/dto/request/CreateReadingSessionRequest.java` | `Long photoVerificationId` | R1.4 |
| `backend/.../reading/application/ReadingSessionService.java` | 저장 후 인증을 세션에 연결 | R5.1, R5.2 |
| `backend/.../reward/infrastructure/PendingPhotoCertificationChecker.java` → `CertificationPhotoChecker.java` | 실제 조회로 교체 | R5.3 |
| `backend/src/test/...` | `GeminiRetryPolicyTest`, `CertificationVerifierTest`(429 통과), `ReadingSessionServiceTest`(연결·남의 인증·통과 못 함·이미 쓰임), 보상 확인(429 통과 제외) | R4, R5 |
| `frontend/src/features/fe1/api/photoVerifyApi.ts` | 주소·요청(`image`만)·응답 변환. `verify(recordId, uri, signal)` | R1.1~R1.3, R2 |
| `frontend/src/features/fe1/hooks/reading/useReadingEnd.ts` | `currentRound.readingRecordId`로 검증, 회차가 없으면 오류 안내 | R1.1, R3.2 |
| `frontend/src/features/fe1/constants/config.ts` | `PHOTO_VERIFY_USE_MOCK = false`, `PHOTO_VERIFY_TIMEOUT_MS = 45_000`, 주석 | R1.1, R3.1 |

앱의 세션 저장(`readingApi.saveReadingRecord`)과 독서 완료 화면(사진 보너스 표시)은 바꾸지 않는다.

### 앱 응답 변환

```
BeCertification = { id, readingRecordId, status: 'PASSED'|'UNVERIFIED'|'FAILED', messages: string[], ... }
→ PhotoVerification = {
    verificationId: id,
    verified: status === 'PASSED',
    reason: status === 'PASSED' ? undefined : (messages.join('\n') || undefined),
  }
```

- `PASSED`의 참고 문구는 버린다 (R2.5). `reason`이 없으면 기본 문구(`PHOTO_REJECTED_MESSAGE`) (R2.4).
- 개발용 Mock은 남기고 응답 모양만 새 형식에 맞춘다.

## ④ 고칠 docs 문서

- [x] `docs/domains/reading/api.md` — `POST /api/reading-sessions`의 `photoVerificationId` 설명(인증을 세션에 연결), 독서 인증 절의 "앱 미연결" 제거와 429 응답 설명
- [x] `docs/domains/reading/data.md` — `certifications.reading_session_id`, `ai_skipped`
- [x] `docs/domains/reading/rules.md` — 5절 "AI 장애" 줄(다시 시도·429 통과), "앱 연결"·"보상 연결" 줄 ✅, 세션 연결 규칙
- [x] `docs/domains/reward/rules.md` — 사진 인증 추가 경험치 ✅, 기준(연결된 PASSED, 429 통과 제외)
- [x] `docs/known-issues.md` — TODO-1·TODO-3 해결, TODO-2는 `photos`만 남김, ASK-5 반영, 새 할 일 2개(429 임시 규칙 되돌리기, AI 장애 구분 알림)
- [x] `docs/specs/README.md` — 004 상태

## ⑤ 남은 질문 (❓)

- 없음.

---

## 변경 기록

| 날짜 | 바뀐 내용 | 이유 | 결정 |
|---|---|---|---|
| 2026-11-22 | 다회독 첫 세션 인증의 "회차 옮기기"(옛 R1.5)를 넣었다가 빼고, 인증을 세션에 연결해 보상까지 주는 R5로 바꿈. DB 칸 2개 추가, 승인에 BE2 추가 | 보상은 세션 단위라 회차를 옮겨도 쓸모가 적고, 세션 연결이 더 간단하며 보상 임시 구현(TODO-3)도 함께 해결됨 | 사람 |
| 2026-11-22 | 429로 통과한 인증은 보상 제외 (R5.3) | AI가 사진을 보지 않은 통과에 보상을 주지 않기 위함. 정식 API로 바꾸면 되돌림 | 사람 |
