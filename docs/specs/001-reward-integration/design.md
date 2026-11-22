> 상태: in-progress (구현 완료, 8.1·8.3~8.5 실기기 확인 남음) · 기준: fix/fe1@ef397a6 · 담당: FE1·FE2·BE2
> 원본: `docs/reward-integration/design.md` — 스펙 000에서 이 위치로 옮김. 결정 요약: [decisions/0003](../../decisions/0003-reward-on-complete-screen.md), [0004](../../decisions/0004-dday-records.md)

# 001 · 보상(BE2) 브랜치 병합과 프론트 연결 — Design

요구사항: [requirements.md](./requirements.md)

## 1. 전체 흐름

```
[FE1 독서 종료] ── POST /api/reading-sessions ──▶ 세션 저장 (보상 처리 없음)
      ◀── { id, readingRecordId, status, ... }
 router.replace(toReadingComplete({ sessionId: id, readingRecordId, ... }))

[FE2 독서 완료]
 진입 ── POST /api/rewards/reading-sessions/{sessionId} ──▶ 경험치·퀘스트·D-day 처리 (세션당 1회)
      ◀── ReadingSessionRewardResponse (재호출이면 처음 받은 내역, baseGranted=false)
 GET /api/quests (퀘스트 목록 표시, 병렬)
 GET /api/reading-records/{id}/review (독후감 버튼 상태, 기존)

[D-day·홈·마이·레벨·통계] GET /api/dday → currentStreak / longestStreak 사용
[상점] POST /api/rewards/boosters/use → 상품 목록·보상 상태 다시 조회
```

## 2. 백엔드 — 부스터 부분 적용 (R5.4)

| 파일 | 변경 |
|---|---|
| `UserBuffRepository` | `findOverlappingBuffs(userId, from, to)`: `buffStartAt < to and buffEndAt > from` 인 활성 버프 |
| `UserBuff` | `static long overlapSeconds(List<UserBuff>, from, to)`: 구간을 자르고 겹치는 구간을 합쳐 초 단위로 반환 |
| `ExperiencePolicy` | `boostedExperience(experience, boostedSeconds, durationSeconds)`: `experience + round(experience × (배율-1) × boostedSeconds / durationSeconds)` |
| `RewardService.grantReadingExperience` | 세션 구간 `[endedAt - duration, endedAt]`과 겹치는 버프로 계산. 독서 시간이 0초면 종료 시각에 적용 중인지로 판단 |

- `reading.boosted`는 "조금이라도 겹쳤으면 true"로 유지한다. (응답 형식 변경 없음)

## 3. 프론트엔드

### 3.1 FE1 (세션 번호)
| 파일 | 변경 |
|---|---|
| `features/fe1/types/reading.ts` | `ReadingRecordResult.sessionId?: number \| null` |
| `features/fe1/api/readingApi.ts` | `BeSession.id` 추가, 저장 결과에 `sessionId: session.id` |
| `constants/routes.ts` | `toReadingComplete`에 `sessionId?` 파라미터 |
| `features/fe1/screens/ReadingEndScreen.tsx` | `sessionId: saved.sessionId ?? undefined` 전달 |

### 3.2 FE2 API
| 파일 | 변경 |
|---|---|
| `api/rewardApi.ts` | `claimReadingSessionReward(sessionId)`, `activateExpBooster()`, `formatBuffEndTime()`, `RewardStatusView`에 `expBuffActive`, `expBuffExpiredAt` 추가 |
| `api/ddayApi.ts` | `DdaySnapshot`에 `currentStreak`, `longestStreak`. `saveDday`는 목표만 전송 |

### 3.3 독서 완료 화면
- `useReadingComplete`
  - 파라미터에 `sessionId` 추가
  - `sessionId`가 있으면 `useRef` 가드로 보상 API 1회 호출 + 퀘스트 목록 병렬 조회
  - 상태: `rewardState = none | loading | granted | alreadyGranted | error`, `retryReward()`
  - 응답 → 화면 값: 연속일 `streak.currentStreak`, 레벨 `level`, 경험치 바 `currentExperience / nextLevelExperience`, 획득 경험치·코인은 R3.2 공식
  - 퀘스트 목록은 `GET /api/quests`의 오늘 퀘스트, 이번에 달성한 퀘스트(`completedQuests`)는 완료 표시
  - `sessionId`가 없으면 기존 조회 흐름(`GET /api/rewards`, `/api/quests`) 유지
- `StreakLevelCard`: 로딩·실패(다시 시도) 표시, `leveledUp`이면 "레벨 업!", 사진 보너스 문구, 재진입이면 "+N" 강조 숨김
- `RewardCoinCard`: 로딩·실패 표시, 재진입이면 "이미 받은 보상이에요"

### 3.4 D-day와 연속일
- `DdayScreen`: `changeRecord`는 날짜 선택만. 저장은 목표만. 요약의 연속일·최장 연속은 서버 값, 집계(읽은 날·방어한 날)는 달력 계산
- 홈·마이페이지·레벨·통계: `summarizeDday(records).currentStreak` → `dday.currentStreak`

### 3.5 부스터
- `ShopScreen`: EXP 부스터 섹션 아래 "부스터 사용" 카드 (보유 합계, 적용 중 끝나는 시각, 사용하기 버튼). 사용 후 상품·보상 상태 다시 조회
- `RewardScreen`: 레벨 카드 아래 "EXP 부스터 적용 중 (~HH:MM)" 표시
- 부스터 상품 설명을 "경험치 2배 30분" 기준으로 수정

## 4. 커밋 계획
1. `merge: fix/integration2 보상(BE2) 브랜치 병합` (완료)
2. `feat: 부스터 적용 시간 비율만큼 독서 경험치 2배 적용` (백엔드)
3. `feat: 독서 완료 보상 API 연결과 연속일·부스터 화면 반영` (프론트)
