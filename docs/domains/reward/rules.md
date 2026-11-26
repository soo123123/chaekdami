> 기준: main@82df578 + 스펙 004 + 스펙 005 · 최종 확인: 2026-11-25 · 담당: BE2

# reward 규칙

값을 바꾸려면 코드 위치의 상수를 고치고 이 표도 고친다. API·규칙이 바뀌는 변경은 스펙부터 쓴다 ([specs/README.md](../../specs/README.md)).

## 1. 독서 완료 보상

`POST /api/rewards/reading-sessions/{id}` — `ReadingSessionRewardService.grant`

### 처리 순서

```
0. 사진 인증 여부 조회 (트랜잭션 시작 전. 실패하면 인증 안 됨으로 봄)
1. 보상 계정 잠금 (비관적 쓰기, 대기 3초 → 초과 시 409 CONCURRENCY_001)
2. 내 세션인지 확인 (아니면 404 REWARD_005)
3. 세션이 3분 미만이면 거절 (400 REWARD_007)
4. 세션 보상 내역(reading_session_rewards) 찾기, 없으면 생성 (levelBefore 기록)
5. 기본 보상을 아직 안 받았으면:            ← reward_transactions에 READING_COMPLETE 이력 여부로 판단
   a. 독서 경험치 지급 (부스터 반영)
   b. 퀘스트 진행 반영 → 달성한 퀘스트 자동 지급
   c. 세션 날짜 전까지 놓친 날을 방어권으로 정산
   d. 세션 날짜가 이미 "방어"였으면 방어권 1개 환불
   e. 세션 날짜를 D-day 달력에 "읽음"으로 기록
6. 사진 인증된 세션이고 추가 보상을 아직 안 받았으면: 경험치 +20 (사진 인증된 세션 = 세션 저장 때 연결된 독서 인증이 `PASSED`이고, AI 사용 한도 초과로 확인 없이 통과한 것이 아님 — [reading/rules](../reading/rules.md#5-독서-인증))
7. 연속 일수 다시 계산해 계정에 반영
8. 이 세션의 보상 내역 + 지금 상태를 응답
```

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 세션당 기본 보상 횟수 | 1번 | `RewardLedger.isExperienceGranted` + UNIQUE `uk_reward_transactions_…` | ✅ |
| 재호출 응답 | 처음 받은 내역 그대로, `baseGranted=false` | `ReadingSessionReward` | ✅ |
| 보상 거절 최소 시간 | 3분 미만 | `ReadingSession.MIN_SECONDS` | ✅ |
| 퀘스트·D-day 기준 날짜 | 세션 종료 날짜 (`endedAt`) | `grantBase` | ✅ |
| 사진 인증 조회 실패 시 | 기본 보상만 지급, 추가 보상 건너뜀. 조회는 보상 트랜잭션을 시작하기 전에 끝내서, 실패해도 기본 보상이 취소되지 않음 | `isPhotoCertified` | ✅ |

## 2. 경험치

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 시간 경험치 | 1분당 1 EXP (30초 이상은 1분으로 반올림) | `ExperiencePolicy.SECONDS_PER_EXPERIENCE` | ✅ |
| 쪽수 경험치 | 5쪽당 1 EXP (나머지 3쪽 이상이면 +1) | `ExperiencePolicy.PAGES_PER_EXPERIENCE` | ✅ |
| 읽은 쪽 수 | `endPage - startPage` | `ExperiencePolicy.readingExperience` | ✅ |
| 사진 인증 추가 경험치 | 20 EXP, 재화 없음, 부스터 미적용 | `ExperiencePolicy.PHOTO_CERTIFICATION_EXPERIENCE` | ✅ |
| 사진 인증 판단 | 세션에 연결된 인증이 `PASSED` + `ai_skipped` 아님. 429로 통과한 인증은 제외 (임시 규칙) | `CertificationPhotoChecker` → `CertificationService.isPhotoCertified` | ✅ ⏳ [TODO-23](../../known-issues.md#todo-23) |

예: 25분 40초, 12쪽 → 26 + 2 = **28 EXP**

### 레벨

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 시작 레벨 | 1 | `RewardAccount` | ✅ |
| 레벨업 필요 경험치 | Lv.1→2: 80, 이후 약 20씩 증가, Lv.19→20: 450 | `LevelPolicy.REQUIRED_EXPERIENCE` | ✅ |
| Lv.20 이상 | 레벨당 450 | `LevelPolicy.MAX_TIER_REQUIRED_EXPERIENCE` | ✅ |
| 승급 보상 재화 | 10의 배수 레벨 1,000 · 5로 끝나는 레벨 500 · 그 외 Lv.2~9: 100, Lv.11~19: 150, Lv.21~: 200 | `LevelPolicy.promotionReward` | ✅ |
| 레벨 해금 | — | — | ⏳ [TODO-6](../../known-issues.md#todo-6) |

| 레벨 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 직전 레벨에서 필요 | 80 | 100 | 120 | 140 | 160 | 185 | 205 | 225 | 245 | 265 | 285 | 305 | 325 | 345 | 370 | 390 | 410 | 430 | 450 |

## 3. 경험치 부스터

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 효과 | 독서 경험치 2배 | `ExperiencePolicy.BOOSTER_MULTIPLIER` | ✅ |
| 효과 시간 | 30분. 적용 중에 또 쓰면 30분 연장 (배율은 그대로) | `ExperiencePolicy.BOOSTER_DURATION`, `BoosterService.use` | ✅ |
| 적용 범위 | 독서 경험치만. 퀘스트 보상·사진 보너스에는 미적용 | `BoosterService` | ✅ |
| 부분 적용 | 독서 구간 `[종료-독서시간, 종료)` 중 부스터와 겹친 시간 **비율만큼만** 2배 (반올림) | `ExperiencePolicy.boostedExperience(exp, boostedSeconds, durationSeconds)` | ✅ |
| 겹친 시간 계산 | 부스터끼리 겹친 시간은 한 번만 계산 | `UserBuff.overlapSeconds` | ✅ |
| 독서 시간 0초 | 종료 시각에 부스터 적용 중이면 전체 2배 | `RewardService.grantReadingExperience` | ✅ |

예: 60 EXP, 독서 60분 중 20분이 부스터 → 60 + 20 = **80 EXP**

> ⚠️ [ISSUE-BUG-6](../../known-issues.md#issue-bug-6) — 테스트 환경에서 독서 시간이 부스터보다 길면 부스터가 적용되지 않음 (원인 확인 필요)

## 4. 일일 퀘스트

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 출제 시점 | 그날 처음 `GET /api/quests`를 부를 때 사용자별로 생성 | `QuestService.getOrCreateTodayQuests` | ✅ |
| 하루 출제 수 | 3개 (등록된 퀘스트가 적으면 전부) | `DailyQuest.DAILY_QUEST_COUNT` | ✅ |
| 출제 방식 | `alwaysIncluded` 퀘스트는 항상, 나머지 칸은 랜덤 | `DailyQuestPicker` | ✅ |
| 진행 반영 | 독서 완료 보상 때 세션 날짜의 퀘스트에 반영. 지난 날짜 퀘스트를 새로 만들지는 않음 | `QuestService.recordReadingSession` | ✅ |
| 독서 시간 진행 | 분 단위, 30초 이상 반올림 | `QuestService` | ✅ |
| 달성 시 | 바로 재화·경험치 지급 (`REWARDED`). 수령 API 없음 | `QuestService.grantReward` | ✅ |
| 주간 퀘스트 | — | `QuestType.WEEKLY` | ⏳ [TODO-5](../../known-issues.md#todo-5) |

### 퀘스트 목록 (`DailyQuest` enum)

| 코드 | 제목 | 진행 기준 | 목표 | 재화 | 경험치 | 매일 출제 |
|---|---|---|---|---|---|---|
| `FIRST_READING_SESSION` | 오늘의 첫 독서 세션 시작하기 | 세션 수 | 1 | 50 | 10 | ✅ |
| `READING_15_MINUTES` | 오늘 독서 15분 달성하기 | 독서 분 | 15 | 75 | 15 | |
| `READING_30_MINUTES` | 오늘 독서 30분 달성하기 | 독서 분 | 30 | 100 | 20 | |

- 퀘스트를 추가·수정하려면 `DailyQuest`에 상수를 추가·수정한다. 앱 시작 시 `DailyQuestSeeder`가 DB를 맞춘다.
- **상수 이름(코드)은 바꾸지 않는다.** 바꾸면 다른 퀘스트로 취급된다.
- 상수를 지우면 출제에서만 빠지고 DB 행은 남는다.

## 5. 상점

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 구매 수량 | 1~99 | `ShopService.MAX_PURCHASE_QUANTITY` | ✅ |
| 차감 재화 | 가격 × 구매 수량 | `ShopService.purchase` | ✅ |
| 지급 수량 | 묶음 수량 × 구매 수량 | `ShopService.purchase` | ✅ |
| 잔액 확인 | 보상 계정을 잠근 뒤 서버 잔액 기준 | `RewardLedger.lockAccount` | ✅ |
| 중복 구매 방지 | 요청의 `ownedQuantity`가 그 상품의 서버 보유 개수와 다르면 구매하지 않음. 보상 계정을 잠근 뒤, 잔액보다 먼저 비교. 보내지 않으면 비교하지 않음 | `ShopService.purchase` | ✅ 서버 (앱 반영 전) |
| 가격 0인 상품 | 차감·이력 없이 지급 | `ShopService.purchase` | ✅ |

### 상품 (`ShopItemSeeder`)

| 이름 | 가격 | 종류 | 묶음 |
|---|---|---|---|
| D-day 방어권 1개 | 200 | `SHIELD` | 1 |
| D-day 방어권 5개 | 900 | `SHIELD` | 5 |
| D-day 방어권 10개 | 1,600 | `SHIELD` | 10 |
| EXP 부스터 1개 | 200 | `EXPERIENCE_BOOSTER` | 1 |
| EXP 부스터 5개 | 900 | `EXPERIENCE_BOOSTER` | 5 |
| EXP 부스터 10개 | 1,600 | `EXPERIENCE_BOOSTER` | 10 |

Seeder는 같은 이름의 상품이 없을 때만 넣는다. 이미 있는 상품의 가격을 바꾸려면 DB를 직접 고쳐야 한다.

## 6. 방어권과 연속 독서

방어권 자동 정산, 환불, 연속 일수 계산은 D-day 달력 기준이다 → [dday/rules.md](../dday/rules.md)

| 규칙 | 값 | 코드 위치 |
|---|---|---|
| 정산 시점 | `GET /api/rewards`, `GET /api/dday`, 독서 완료 보상 때 | `StreakService.settleBefore` |
| 계정의 dday·max_dday | 독서 완료 보상 때만, 계정을 잠근 상태로 달력 계산값을 반영 (저장값은 캐시). 조회는 저장하지 않고 달력으로 계산한 값을 바로 응답 | `RewardAccount.syncStreak` |

## 7. 동시성

| 규칙 | 값 | 코드 위치 |
|---|---|---|
| 재화·경험치·아이템을 바꾸는 요청 | 보상 계정 행을 비관적 쓰기 잠금 | `RewardLedger.lockAccount` |
| 잠금 대기 | 3초, 넘으면 409 `CONCURRENCY_001` | `RewardAccountRepository.LOCK_TIMEOUT_MILLIS` |
| 계정 동시 생성 | 같은 트랜잭션에서 없을 때만 저장(`ON CONFLICT DO NOTHING`), 이미 있으면 그 계정 사용. DB 연결을 더 쓰지 않음 | `RewardAccountRepository.insertIfAbsent` |

## 8. 주간 랭킹

`GET /api/rewards/rankings/weekly/experience` · `/weekly/reading-time` — `RankingService` · 결정 배경: [specs/005](../../specs/005-weekly-ranking/)

경험치 랭킹과 독서 시간 랭킹은 따로 매긴다. 점수 출처만 다르고 순위 규칙은 같다.

| 규칙 | 경험치 랭킹 | 독서 시간 랭킹 | 코드 위치 |
|---|---|---|---|
| 점수 | 그 주 `reward_transactions` 중 `INCOME_EXPERIENCE` 금액 합 (독서·부스터·퀘스트·사진 인증). 재화(승급 보상 등)는 빠짐 | 그 주 `reading_sessions.duration_seconds` 합 (초). 보상·부스터와 무관 | `RewardTransactionRepository.findTopAmounts`, `ReadingSessionTimeQueryRepository.findTopSeconds` |
| 어느 주인가 | 지급 시각 `created_at`. 일요일 밤 세션도 월요일에 보상받으면 새 주 | 세션 종료 시각 `ended_at` (서버가 저장 요청을 받은 시각) | `RankingWeek.startAt`·`endAt` |
| 한 주 | 한국 시간 월요일 0시 ≤ 시각 < 다음 월요일 0시. 서버 시간대와 무관 | 같음 | `RankingWeek` |
| 상위 인원 | 30명 | 같음 | `RankingService.TOP_SIZE` |
| 동점 | 같은 순위, 다음 순위는 건너뜀 (1, 2, 2, 4). 같은 순위 안에서는 사용자 번호 작은 순 | 같음 | `RankingService.toEntries` |
| 제외 | 조회하는 순간 정지 중인 회원, 관리자. 다른 사람의 순위에도 세지 않음 | 같음 | `RankingTargets` (정지 기준은 `User.isSuspendedAt`과 같음) |
| 0점 | 합계가 0보다 큰 사용자만 나옴 | 같음 | 쿼리 `having` |
| 내 순위 | 나보다 점수가 큰 사용자 수 + 1. 0점이거나 본인이 제외 대상이면 `null` (점수는 그대로) | 같음 | `countUsers…GreaterThan` |
| 탈퇴한 사용자 | 탈퇴 때 이력이 지워져 나오지 않음 | 탈퇴 때 세션이 지워져 나오지 않음 | `RewardCleanupService`, `ReadingCleanupListener` |
| 책 삭제 | 경험치 이력이 남아 점수 유지 ([ISSUE-DATA-3](../../known-issues.md#issue-data-3)) | 세션이 지워져 점수에서 빠짐 | — |
| 닉네임 | user 도메인을 읽기만 함. 못 찾으면 목록에서 뺌 | 같음 | port `UserNicknameReader` → `RewardUserNicknameReader` |
| 독서 시간 읽기 | — | reading 도메인을 읽기만 함 | port `WeeklyReadingTimeReader` → `ReadingSessionTimeReader` |
