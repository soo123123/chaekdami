> 상태: in-progress (2026-11-22 승인, 구현·docs 완료, 사람 확인 남음) · 작성: 2026-11-22 · 기준: main@82df578 · 담당: BE1
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# 004 · 독서 인증 앱 연결과 사진 인증 보상 — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. 끝난 작업은 체크한다.
- 작업 하나는 한 번에 끝나고 바로 검증할 수 있는 크기로 쪼갠다.
- 설계와 다르게 해야 하면 멈추고 보고한다. (S10)

## 1. 서버 — AI 호출 다시 시도와 429

- [x] 1.1 `PageExtraction`에 `aiSkipped` 칸과 `skipped()` 추가, `GeminiPageTextExtractor`·`MockPageTextExtractor` 생성 코드 맞춤 — R4.3
      검증: `cd backend && ./gradlew compileJava`
- [x] 1.2 `GeminiRetryPolicy` 추가 (`classify`, `shouldRetry`) + `GeminiRetryPolicyTest` (429 / 5xx / 연결 실패 / 응답 시간 초과 / 그 밖, 4초 경계) — R4.1, R4.2, R4.5, R4.6
      검증: `cd backend && ./gradlew test --tests '*GeminiRetryPolicyTest'`
- [x] 1.3 `GeminiPageTextExtractor.extract`에 최대 2번 호출(1초 쉼) 적용, 429면 `skipped()` — R4.1~R4.6
      검증: `cd backend && ./gradlew compileJava` + 코드 확인 (사진 축소·본문 만들기는 한 번만)
- [x] 1.4 `CertificationVerifier`: `aiSkipped`면 다른 검사 없이 `PASSED` + "AI 확인 없이 통과했어요. (사용 한도 초과)" + `CertificationVerifierTest` — R4.3, R4.4, R4.7
      검증: `cd backend && ./gradlew test --tests '*CertificationVerifierTest'`

## 2. 서버 — 인증을 세션에 연결

- [x] 2.1 `Certification`에 `readingSessionId`(UNIQUE, NULL 허용)·`aiSkipped`(`Boolean`) 칸, `linkSession(Long)`. `CertificationService.certify`에서 `aiSkipped` 저장 — R4.4, R5.4
      검증: `cd backend && ./gradlew compileJava`
- [x] 2.2 `CertificationRepository.findByIdAndUserId` 추가 — R5.1
      검증: `cd backend && ./gradlew compileJava`
- [x] 2.3 `CreateReadingSessionRequest`에 `photoVerificationId` 추가, `ReadingSessionService.create`에서 저장 후 연결 (내 것 + `PASSED` + 안 쓰임만, 그 밖은 무시) — R1.4, R5.1, R5.2, R5.4
      검증: `cd backend && ./gradlew test --tests '*ReadingSessionServiceTest'` — 연결됨 / 남의 인증 / `UNVERIFIED` / 이미 다른 세션에 쓰임 / 없는 번호 / 다른 회차(다회독 첫 세션)도 연결 케이스 추가
- [x] 2.4 탈퇴 경로에서 세션·인증 삭제 순서 확인 (남는 연결이 없는지). 문제가 있으면 멈추고 보고 — R5.4
      검증: `UserService` 탈퇴 코드 읽고 결과를 이 줄에 적기
      결과 (2026-11-22): 탈퇴 때 reading 리스너가 없어 세션·인증이 **둘 다 그대로 남는다** (기존 [ISSUE-DATA-2](../../known-issues.md#issue-data-2)). 둘이 함께 남으므로 끊긴 연결은 생기지 않는다. 책 삭제(`BookService`)는 인증 → 세션 순서로 함께 지우고, `reading_session_id`는 외래 키가 아닌 숫자 칸이라 순서 문제도 없다. 코드 변경 없음

## 3. 서버 — 사진 인증 보상

- [x] 3.1 `CertificationRepository`에 보상 확인용 조회, `CertificationService.isPhotoCertified(userId, readingSessionId)` (연결됨 + `PASSED` + `aiSkipped`가 true 아님) — R5.3
      검증: `cd backend && ./gradlew compileJava`
- [x] 3.2 `PendingPhotoCertificationChecker` → `CertificationPhotoChecker`로 교체 (포트·`ReadingSessionRewardService`는 그대로) + 테스트 (인증됨 / 429 통과 제외 / 연결 없음) — R5.3
      검증: `cd backend && ./gradlew test --tests '*PhotoChecker*'`

## 4. 앱 — 실제 서버로 인증

- [x] 4.1 `photoVerifyApi.ts`: 주소 `POST /api/reading-records/{recordId}/certifications`, 요청은 `image`만, 응답 변환(`status` → `verified`, `messages` → `reason`, `PASSED` 문구 버림), Mock 응답 모양 맞춤, `verify(recordId, uri, signal)` — R1.1~R1.3, R2.1~R2.5
      검증: `cd frontend && npx tsc --noEmit`
- [x] 4.2 `useReadingEnd.ts`: `currentRound.readingRecordId`로 검증, 회차가 없으면 오류 안내 — R1.1, R3.2
      검증: `cd frontend && npx tsc --noEmit`
- [x] 4.3 `config.ts`: `PHOTO_VERIFY_USE_MOCK = false`, `PHOTO_VERIFY_TIMEOUT_MS = 45_000`, 주석 갱신 — R1.1, R3.1
      검증: `cd frontend && npx tsc --noEmit` + `python3 scripts/harness/contract-check.py` 불일치 0건 (R6.1)

## 5. 직접 확인 (사람)

- [ ] 5.1 책 페이지 사진 → 통과 → 저장 → 완료 화면에 사진 보너스 +20 EXP — R1, R2.1, R5.1, R5.3
- [ ] 5.2 책이 아닌 사진 → 안내 문구와 함께 사진 지워짐 — R2.2
- [ ] 5.3 흐린 사진(글자 거의 없음) → 다시 찍기 안내 — R2.3
- [ ] 5.4 같은 페이지 다시 찍기 → 재사용 안내 — R2.2
- [ ] 5.5 다회독 첫 세션에서 사진 인증 → 보상 받는지 — R5.1
- [ ] 5.6 (가능하면) 429 상황에서 통과는 되지만 사진 보너스는 없는지 — R4.3, R5.3

      진행 기록 (2026-11-22, 시뮬레이터): 책이 아닌 아무 이미지 → 통과 못 하고 사진 지워짐 (5.2·5.3 중 어느 판정인지는 미확인). 사진 없는 30분 세션(API 직접 호출) → 독서 경험치·퀘스트 재화 정상 지급 (사진 보너스 없음, 정상). 책 페이지 사진 통과 → +20 EXP(5.1·5.5)는 실제 책 사진으로 확인 필요

## 9. 마무리

- [x] 9.1 전체 테스트 — 검증: `cd backend && ./gradlew test` (`contextLoads`는 DB 없으면 실패: [TODO-21](../../known-issues.md#todo-21))
      결과 (2026-11-22): 228개 중 227개 통과. 실패 1개는 `contextLoads` (DB 비밀번호 없음, TODO-21)
- [x] 9.2 계약 검사 — 검증: `python3 scripts/harness/contract-check.py`
- [x] 9.3 **docs 반영**: design ④의 문서 전부 수정 — 검증: `python3 scripts/harness/docs-check.py`
      함께 고침: `architecture.md`, `overview.md`, `reading/overview.md`, `reward/overview.md`, `conventions/testing.md`, `conventions/harness.md` (옛 TODO-1·임시 구현 언급). 새 할 일 TODO-23(429 임시 규칙), TODO-24(AI 장애 알림)
- [ ] 9.4 상태 줄을 done으로, `docs/specs/README.md` 목록 갱신 — 5단계(사람 확인)가 끝나면 한다
