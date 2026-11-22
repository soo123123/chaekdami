> 상태: **superseded → [001](../001-reward-integration/)** · 담당: FE1
> 원본: `docs/reading-reward/design.md` — 스펙 000에서 이 위치로 옮김.
> 이 스펙의 방식(`POST /api/reading-sessions/{sessionId}/reward`, PENDING 보상 등)은 구현되지 않았다. 실제 구현은 001을 본다.

# 002 · 독서 보상 연결 — Design

요구사항: [requirements.md](./requirements.md)

## 1. 전체 흐름

```
[FE1 독서 종료]                     [BE reading]                         [BE2 reward]
 저장 버튼 ── POST /api/reading-sessions ──▶ 세션 저장
                                     ├─ SessionReward(PENDING) 생성
                                     └─ afterCommit ──▶ ReadingSessionFacts.record()
                                                         ├─ StreakService.recordReadingDay()
                                                         └─ QuestService.recordProgress()  (지급 X)
          ◀── { id, readingRecordId, status, ... }
 router.replace(toReadingComplete({ sessionId: id, ... }))

[FE2 독서 완료]
 진입 ── POST /api/reading-sessions/{id}/reward ─────────────▶ ReadingSessionRewardService.claim()
                                                         ├─ PENDING → 지급 → GRANTED + 스냅샷 저장
                                                         └─ GRANTED → 스냅샷 반환 (alreadyGranted)
          ◀── ReadingSessionRewardResponse
 GET /api/quests (퀘스트 목록 표시용, 병렬)

[미수령 정산]
 GET /api/rewards ──▶ RewardService.getStatus() 앞에서 settlePending(userId)
```

## 2. 백엔드 (BE2 중심)

### 2.1 데이터: `reading_session_reward` (신규, reward 도메인)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | bigint PK | |
| session_id | bigint **UNIQUE** | `reading_session.id` (멱등 키) |
| user_id | bigint | |
| status | varchar | `PENDING` / `GRANTED` |
| duration_seconds, start_page, end_page | int | 지급 계산 입력값 (세션에서 복사) |
| photo_verified | boolean | D5 자리. 지금은 항상 false |
| result_json | text/jsonb | 지급 결과 스냅샷 (`ReadingSessionRewardResult`) |
| created_at, granted_at | timestamp | |

- 세션 테이블에 컬럼을 붙이지 않고 reward 도메인에 둔다 → reading 도메인 변경 최소화, BE2 소유.
- 스냅샷은 JSON 한 칸으로 둔다(화면 재표시 전용, 조회 조건 없음).

### 2.2 reading 쪽 변경 (`ReadingSessionService.create`)

```java
ReadingSession saved = readingSessionRepository.save(session);
// 삭제: questService.recordReadingSession(userId, request.readingTime());
// 삭제 또는 BE2 결정: ddayService.markTodayRead(userId);   ← R5.1
readingSessionRewardHook.onSessionSaved(saved);   // 한 줄 연동 (아래)
```

### 2.3 reward 쪽 변경

**`ReadingSessionRewardHook.onSessionSaved(ReadingSession)`** — 기존 Hook의 역할을 바꾼다.
- 같은 트랜잭션: `SessionReward(PENDING)` insert (세션 저장과 함께 커밋/롤백).
- afterCommit: `ReadingSessionFacts.record(userId, durationSeconds)` — 스트릭 기록 + 퀘스트 진행도. 실패해도 로그만(R1.4).

**`QuestService` 분리**
- `recordProgress(userId, durationSeconds)` : 진행도만 반영 (`IN_PROGRESS → COMPLETED`), 지급 없음.
- `claimCompleted(account, userId)` : `COMPLETED` 상태 퀘스트 전부 지급 → `REWARDED`. 반환 `List<QuestRewardResult>`.
- 기존 `recordReadingSession`은 위 둘로 대체(테스트 수정 필요). `claimReward(userId, userQuestId)` 유지(R5.2).

**`ReadingSessionRewardService.claim(userId, sessionId)`** — 기존 `grant()`를 개편.
```
@Transactional
claim(userId, sessionId):
  reward = repo.findBySessionIdAndUserIdForUpdate(sessionId, userId) ?: throw 404
  if reward.status == GRANTED: return (snapshot, alreadyGranted=true)
  account = rewardLedger.lockAccount(userId); levelBefore = account.level
  reading = rewardService.grantReadingExperience(userId, d, s, e)
  quests  = questService.claimCompleted(account, userId)
  photo   = photoBonusPolicy.grant(account, reward.photoVerified)   // 지금은 0
  result  = ReadingSessionRewardResult(...)
  reward.grant(result)   // GRANTED, result_json, granted_at
  return (result, alreadyGranted=false)
```
- 스트릭은 저장 시점(facts)에서 처리하므로 claim에서 호출하지 않는다. 응답의 streak 값은 계정 현재값으로 채운다.
- 보상 행이 없는 과거 세션(이 작업 전에 저장된 세션)은 404를 반환하고, 프론트는 GET 조회로 폴백한다.

**정산 `settlePending(userId)`** — `RewardService.getStatus()` 첫 줄(`streakService.settleIfNeeded` 옆)에서 호출.
PENDING 세션을 오래된 순으로 `claim`과 같은 로직으로 처리. 한 건 실패해도 나머지·조회는 계속.

### 2.4 API

`POST /api/reading-sessions/{sessionId}/reward` (컨트롤러는 reward/presentation, 헤더 `X-User-Id` 기존 방식)

```jsonc
// 200
{
  "sessionId": 123,
  "alreadyGranted": false,
  "experience": 30,            // 독서 경험치 (퀘스트 경험치 제외)
  "boosted": false,
  "photoBonus": { "verified": false, "currency": 0, "experience": 0 },
  "completedQuests": [
    { "userQuestId": 7, "title": "오늘 독서 15분 달성하기", "rewardCurrency": 75, "rewardExperience": 10 }
  ],
  "totalExperience": 40,       // experience + 퀘스트 경험치 + 사진 경험치  → 화면 "+N exp"
  "totalCurrency": 75,         // 퀘스트 + 승급 + 사진 재화              → "오늘의 보상 코인"
  "promotionReward": 0,
  "levelBefore": 1,
  "level": 1,
  "currentExperience": 45,
  "nextLevelExperience": 80,
  "currency": 1250,
  "streak": { "current": 3, "max": 5, "newlyAchieved": true }
}
```
에러: 404(세션 없음/남의 세션/보상 행 없음), 409 없음(멱등).

`POST /api/reading-sessions` 응답은 변경 없음(`id` 이미 포함).

## 3. 프론트엔드

### 3.1 FE1 — 세션 번호 전달
- `readingApi.ts` `BeSession`에 `id` 추가, `saveReadingRecord()` 결과에 `sessionId` 추가.
- `types/reading.ts` `ReadingRecordResult`에 `sessionId?: number`.
- `routes.ts` `toReadingComplete`에 `sessionId?` 파라미터 추가.
- `useReadingEnd` → 완료 화면 이동 시 `sessionId` 전달.

### 3.2 FE2 — 지급 호출·표시
- `api/rewardApi.ts`: `claimReadingSessionReward(sessionId): Promise<ReadingSessionRewardView>` 추가.
- `types/readingComplete.ts`: `ReadingCompleteParams.sessionId`, `ReadingCompleteData.rewardState: 'idle'|'loading'|'granted'|'error'`, `alreadyGranted`, `leveledUp`.
- `useReadingComplete`:
  - 파라미터에 `sessionId` 추가.
  - 마운트 시 `sessionId`가 있으면 `claim` 1회 (`useRef`로 StrictMode·재렌더 중복 방지). 동시에 `getQuests()`.
  - claim 성공 → 레벨/경험치/D-day/획득 경험치/코인을 응답값으로. `getRewardStatus()`는 호출하지 않음.
  - claim 실패 → `rewardState='error'`, `retry()` 노출. 표시값은 `getRewardStatus()` 폴백.
  - `sessionId` 없음 → 기존 GET 흐름 그대로.
  - 퀘스트 카드: 목록은 `getQuests()`, 이번에 지급된 항목은 `completedQuests`로 강조.
  - `gainedExp` 추정 로직 삭제 → `totalExperience`.
- 컴포넌트: `StreakLevelCard`·`RewardCoinCard`에 로딩/에러(다시 시도) 상태, `alreadyGranted`면 연출 생략.

## 4. 오류·경계 사례

| 상황 | 동작 |
|------|------|
| 완료 화면 두 번 진입 / 뒤로 갔다 다시 | `alreadyGranted: true`, 같은 값, 연출 없음 |
| 지급 요청 네트워크 실패 | 카드 에러 + 다시 시도. 안 누르고 나가도 PENDING → 다음 `GET /api/rewards`에서 정산 |
| 앱 종료로 완료 화면 못 봄 | 동일 (정산) |
| 저장 후 facts(스트릭·진행도) 실패 | 로그만. 보상 행은 PENDING이라 경험치는 지급됨 (퀘스트 진행만 누락) |
| 하루에 세션 여러 개 | 세션마다 보상 행 1개. 퀘스트 보상은 먼저 claim한 세션에 붙음 |
| 동시 요청 | 보상 행 `FOR UPDATE` + 계정 잠금으로 직렬화 |
| 다음 날 정산 | 진행도·스트릭은 이미 저장 시점 날짜로 반영됨 → 날짜 틀어짐 없음 |

## 5. 열린 질문 (BE2 확인)
1. `DdayService.markTodayRead`와 `StreakService.recordReadingDay` 중 어느 쪽이 화면 D-day의 원천인가? (현재 `/api/rewards`의 `currentStreak`은 RewardAccount.dday)
2. 경험치 정책(`ExperiencePolicy.readingExperience`)의 최소 독서 시간·일일 상한 필요 여부
3. 사진 보너스 금액 (D5 활성화 시)
