> 상태: **superseded → [001](../001-reward-integration/)** · 담당: FE1
> 원본: `docs/reading-reward/tasks.md` — 스펙 000에서 이 위치로 옮김.
> 이 스펙의 방식(`POST /api/reading-sessions/{sessionId}/reward`, PENDING 보상 등)은 구현되지 않았다. 실제 구현은 001을 본다.

# 002 · 독서 보상 연결 — Tasks

설계: [design.md](./design.md) · 순서대로 진행, 각 단계는 앞 단계 머지 후 시작 가능(FE는 Mock으로 병행 가능).

## Phase 0. 합의
- [ ] 0.1 requirements의 D3(서버 정산)·D5(사진 보너스 자리만) 확정 — FE1
- [ ] 0.2 design §5 열린 질문 BE2와 정리, API 응답 필드 확정 — FE1·FE2·BE2

## Phase 1. 백엔드 (BE2)
- [ ] 1.1 `reading_session_reward` 엔티티·리포지토리 (`findBySessionIdAndUserIdForUpdate`, `findPendingByUserId`) — R1.1
- [ ] 1.2 `QuestService.recordReadingSession` → `recordProgress` / `claimCompleted` 분리, 테스트 수정 — R1.2, R2.6
- [ ] 1.3 `ReadingSessionRewardHook.onSessionSaved(session)`: PENDING insert + afterCommit facts(스트릭·진행도) — R1.1, R1.2, R1.4
- [ ] 1.4 `ReadingSessionService.create()`에서 `questService.recordReadingSession` 제거, Hook 호출 1줄 추가. `markTodayRead` 처리(R5.1)
- [ ] 1.5 `ReadingSessionRewardService.claim()` 멱등 지급 + 스냅샷 저장 — R2.2~R2.4, R2.6
- [ ] 1.6 `POST /api/reading-sessions/{sessionId}/reward` 컨트롤러·응답 DTO — R2.1, R2.5, R2.7
- [ ] 1.7 `RewardService.getStatus()` 앞 `settlePending()` — R4.1, R4.2
- [ ] 1.8 테스트: 중복 호출 1회 지급, 동시 호출, 남의 세션 404, 정산 후 claim 시 alreadyGranted, 저장 롤백 시 보상 행 없음
- [ ] 1.9 `docs/reading-reward-api.md`(또는 기존 문서)에 API 명세 공유

## Phase 2. FE1 (세션 번호 전달)
- [ ] 2.1 `readingApi.ts` `BeSession.id` 추가, `saveReadingRecord` 결과에 `sessionId` — R1.3
- [ ] 2.2 `ReadingRecordResult.sessionId`, Mock API도 sessionId 반환
- [ ] 2.3 `routes.ts` `toReadingComplete`에 `sessionId` 파라미터
- [ ] 2.4 `useReadingEnd` 이동 시 `sessionId` 전달

## Phase 3. FE2 (지급 호출·표시)
- [ ] 3.1 `rewardApi.ts` `claimReadingSessionReward()` + 응답 → View 변환 (+ 개발용 Mock)
- [ ] 3.2 `readingComplete.ts` 타입: `sessionId`, `rewardState`, `alreadyGranted`, `leveledUp`
- [ ] 3.3 `useReadingCompleteParams`에 `sessionId`
- [ ] 3.4 `useReadingComplete`: 진입 시 claim 1회(useRef 가드), 실패 시 GET 폴백 + `retry` — R2.1, R3.2, R3.3, R3.5
- [ ] 3.5 `gainedExp`·`rewardCoin` 프론트 추정 제거 → 응답값 — R3.1
- [ ] 3.6 `StreakLevelCard`·`RewardCoinCard` 로딩/에러/레벨업 표시, `alreadyGranted` 연출 생략 — R3.4, R3.6
- [ ] 3.7 `QuestProgressCard`: 이번에 지급된 퀘스트 강조

## Phase 4. 통합 확인
- [ ] 4.1 시나리오: 저장 → 완료 화면 → 값 확인 → 뒤로 갔다 재진입(같은 값, 연출 없음)
- [ ] 4.2 완료 화면 진입 직후 앱 종료 → 재실행 후 `/api/rewards`에서 정산 확인
- [ ] 4.3 네트워크 끊고 진입 → 에러 카드 → 다시 시도
- [ ] 4.4 하루 2세션: 퀘스트 보상이 한 번만 지급되는지
- [ ] 4.5 `frontend/scripts/skip-reading.mjs` 등 테스트 스크립트로 반복 확인
