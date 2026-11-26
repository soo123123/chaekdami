> 기준: fix/fe1@ef397a6 + 스펙 005 + 스펙 013 · 최종 확인: 2026-11-25 · 담당: BE2

# reward API

공통 규칙(인증, 에러 형식, 날짜): [conventions/api.md](../../conventions/api.md)
모든 API는 로그인이 필요하다. `X-User-Id` 헤더는 보내지 않아도 된다 (토큰으로 대체).

## 목록

| 메서드 | 경로 | 설명 | 성공 | 상태 |
|---|---|---|---|---|
| GET | `/api/rewards` | 내 보상 상태 | 200 | ✅ |
| POST | `/api/rewards/reading-sessions/{readingSessionId}` | 독서 완료 보상 지급 | 200 | ✅ |
| POST | `/api/rewards/boosters/use` | 경험치 부스터 사용 | 200 | ✅ |
| GET | `/api/quests` | 오늘의 일일 퀘스트 + 이번 주 주간 퀘스트 목록 | 200 | ✅ |
| GET | `/api/shop/items` | 상점 상품 목록 | 200 | ✅ |
| POST | `/api/shop/items/{itemId}/purchase` | 상품 구매 | 200 | ✅ |
| GET | `/api/rewards/rankings/weekly/experience` | 이번 주 경험치 랭킹 | 200 | ✅ |
| GET | `/api/rewards/rankings/weekly/reading-time` | 이번 주 독서 시간 랭킹 | 200 | ✅ |

퀘스트 보상 수령 API는 없다. 달성하면 독서 완료 보상에서 자동 지급된다.

---

## GET /api/rewards

앱에서 부르는 곳:

| 위치 | 언제 |
|---|---|
| 홈·레벨(보상)·마이페이지 | 화면에 들어올 때마다 (돌아올 때 포함) |
| 상점 | 화면을 처음 열 때 |
| 부스터 위젯 (모든 화면) | 로그인 상태에서 화면 이동, 앱 복귀, 30초마다, 부스터 사용 직후 |
| 독서 완료 화면 | 세션 번호가 없을 때만 (미리보기 등). 있으면 독서 완료 보상 API를 쓴다 |

**놓친 날이 있으면 방어권 자동 정산을 먼저 처리**하므로 조회지만 데이터가 바뀔 수 있다. 계정이 없으면 만든다.

코드: `RewardController` → `RewardService.getRewardStatus`

```json
{
  "level": 5,
  "currentExperience": 120,
  "nextLevelExperience": 160,
  "experiencePercentage": 75,
  "currency": 1250,
  "currentStreak": 13,
  "ownedShieldCount": 3,
  "expBuffActive": true,
  "expBuffExpiredAt": "2026-11-20T21:30:00"
}
```

| 필드 | 설명 |
|---|---|
| `currentExperience` | 현재 레벨 **구간**에서 쌓은 경험치 (누적 아님) |
| `nextLevelExperience` | 다음 레벨까지 필요한 구간 경험치 |
| `experiencePercentage` | 구간 진행률 0~100 (버림) |
| `currentStreak` | 연속 독서 일수 (D-day 달력 기준) |
| `expBuffExpiredAt` | 부스터가 없으면 `null`. 시간대 표기 없음 |

> ❓ [ASK-9](../../known-issues.md#ask-9) — 서버 날짜 기준과 응답 시각의 시간대 표기

## POST /api/rewards/reading-sessions/{readingSessionId}

독서 완료 화면에 들어올 때 부른다. `readingSessionId`는 `POST /api/reading-sessions` 응답의 `id`다 (`readingRecordId` 아님).

- 세션당 1번만 지급한다. 다시 부르면 지급하지 않고 **처음 받은 내역을 그대로** 돌려준다 (`baseGranted: false`).
- 퀘스트·D-day 날짜는 요청 시각이 아니라 **세션이 끝난 날짜** 기준이다. 주간 퀘스트는 끝난 시각이 속한 주 기준이다.
- `completedQuests`에는 달성한 일일·주간 퀘스트가 함께 들어간다.
- 처리 순서와 규칙: [rules.md](./rules.md#1-독서-완료-보상)

코드: `ReadingSessionRewardController` → `ReadingSessionRewardService.grant`

```json
{
  "readingSessionId": 42,
  "baseGranted": true,
  "reading": { "experience": 26, "boosted": false },
  "photoBonus": { "granted": false, "experience": 0, "currency": 0 },
  "completedQuests": [
    { "userQuestId": 1205, "title": "오늘의 첫 독서 세션 시작하기", "rewardCurrency": 50, "rewardExperience": 10 }
  ],
  "streak": { "currentStreak": 13, "longestStreak": 20, "shieldsUsed": 0, "shieldRefunded": false },
  "promotionReward": 0,
  "levelBefore": 5,
  "level": 5,
  "leveledUp": false,
  "currentExperience": 156,
  "nextLevelExperience": 160,
  "experiencePercentage": 97,
  "currency": 1300
}
```

| 필드 | 설명 |
|---|---|
| `baseGranted` | 이번 요청에서 기본 보상을 처리했으면 `true`, 이미 받은 세션이면 `false` |
| `reading`, `photoBonus`, `completedQuests`, `promotionReward`, `levelBefore`, `leveledUp`, `streak.shieldsUsed`, `streak.shieldRefunded` | **이 세션으로 받은 내역** (재호출해도 같음) |
| `level`, `currentExperience`, `nextLevelExperience`, `experiencePercentage`, `currency`, `streak.currentStreak`, `streak.longestStreak` | **지금 값** |
| `streak.shieldsUsed` | 놓친 날을 막느라 자동으로 쓴 방어권 수 |
| `streak.shieldRefunded` | 읽은 날이 이미 방어권으로 막혀 있어 방어권 1개를 돌려줬는지 |
| `photoBonus.currency` | 항상 0 (사진 보너스는 경험치만) |

## POST /api/rewards/boosters/use

보유한 부스터 1개를 쓴다. 적용 중이면 남은 시간에 30분이 더해진다.

코드: `BoosterController` → `BoosterService.use`

```json
{ "buffEndAt": "2026-11-20T21:30:00", "remainingBoosters": 2 }
```

## GET /api/quests

오늘의 일일 퀘스트 다음에 이번 주의 주간 퀘스트를 준다. 없으면 사용자마다 만든다.

코드: `QuestController` → `QuestService.getTodayQuests`

```json
[
  {
    "userQuestId": 1205,
    "questId": 1,
    "title": "오늘 독서 30분 달성하기",
    "type": "DAILY",
    "targetValue": 30,
    "currentProgress": 15,
    "status": "IN_PROGRESS",
    "rewardCurrency": 100,
    "rewardExperience": 20
  }
]
```

`type`: `DAILY` · `WEEKLY` (일일이 먼저)

`status`: `IN_PROGRESS` · `COMPLETED` · `REWARDED` (자동 지급이라 달성하면 바로 `REWARDED`)

## GET /api/shop/items

판매 중인 상품과 내 보유 수량.

코드: `ShopController` → `ShopService.getActiveItems`

```json
[
  { "id": 1, "name": "D-day 방어권 1개", "price": 200, "type": "SHIELD", "effectValue": 1.0, "bundle": 1, "ownedQuantity": 3 },
  { "id": 4, "name": "EXP 부스터 1개", "price": 200, "type": "EXPERIENCE_BOOSTER", "effectValue": 30.0, "bundle": 1, "ownedQuantity": 0 }
]
```

`ownedQuantity`는 같은 종류(type)가 아니라 **이 상품 행**의 보유 수량이다.

## POST /api/shop/items/{itemId}/purchase

`itemId`는 상품 목록의 `id`다 (YES24 `itemId`와 다름).

코드: `ShopController` → `ShopService.purchase`

```json
// 요청 (본문 생략 시 1개)
{ "purchaseQuantity": 1, "ownedQuantity": 9 }
```

| 요청 필드 | 설명 |
|---|---|
| `purchaseQuantity` | 구매 수량 1~99. 생략하면 1 |
| `ownedQuantity` | 앱이 알고 있는 **그 상품**의 보유 개수 (`GET /api/shop/items`의 `ownedQuantity`). 서버의 개수와 다르면 구매하지 않고 409 `SHOP_002`. 생략하거나 `null`이면 비교하지 않음. 음수면 400 |

> ⚠️ [ISSUE-BUG-35](../../known-issues.md#issue-bug-35) — 앱이 아직 `ownedQuantity`를 보내지 않아 응답이 끊긴 뒤 다시 구매하면 두 번 처리될 수 있음

```json
// 응답
{ "purchaseId": 45, "itemId": 3, "itemName": "D-day 방어권 10개", "remainingCurrency": 750, "updatedInventoryQuantity": 10 }
```

| 필드 | 설명 |
|---|---|
| `purchaseId` | 재화 차감 이력(`reward_transactions`) id. 가격 0인 상품이면 `null` |
| `updatedInventoryQuantity` | 구매 후 이 상품의 보유 수량 (묶음 수량 × 구매 수량만큼 증가) |

## GET /api/rewards/rankings/weekly/experience · GET /api/rewards/rankings/weekly/reading-time

랭킹 화면에서 부른다. 이번 주(한국 시간 월~일) 순위를 두 가지로 따로 매긴다. 조회만 하고 데이터는 바꾸지 않는다. 규칙: [rules.md](./rules.md#8-주간-랭킹)

| 주소 | 점수(`score`) |
|---|---|
| `/weekly/experience` | 이번 주 받은 경험치 |
| `/weekly/reading-time` | 이번 주 독서 시간 (**초**). 앱에서 분·시간으로 바꿔 보여준다 |

코드: `RankingController` → `RankingService.getWeeklyExperienceRanking` · `getWeeklyReadingTimeRanking`

```json
{
  "weekStartDate": "2026-11-23",
  "weekEndDate": "2026-11-29",
  "rankings": [
    { "rank": 1, "nickname": "책벌레", "level": 7, "score": 540, "me": false },
    { "rank": 2, "nickname": "다독왕", "level": 5, "score": 320, "me": true },
    { "rank": 2, "nickname": "밤독서", "level": 9, "score": 320, "me": false },
    { "rank": 4, "nickname": "새내기", "level": 1, "score": 15, "me": false }
  ],
  "myRanking": { "rank": 2, "nickname": "다독왕", "level": 5, "score": 320 }
}
```

| 필드 | 설명 |
|---|---|
| `weekStartDate` · `weekEndDate` | 이번 주 월요일 · 일요일 (한국 날짜) |
| `rankings` | 최대 30개. 점수 높은 순, 같으면 같은 순위(1, 2, 2, 4). 이번 주 점수가 0인 사용자, 정지 중인 회원, 관리자는 없음 |
| `rankings[].level` | 지금 레벨. 보상 계정이 없으면 1 |
| `rankings[].me` | 내 항목이면 `true`. 사용자 번호는 내보내지 않는다 |
| `myRanking` | 상위 30명 밖이어도 온다 |
| `myRanking.rank` | 이번 주 점수가 0이면 `null` (순위 없음). 관리자·정지 중인 회원은 점수가 있어도 `null` |

---

## 에러 코드

정의: `reward/domain/RewardErrorCode.java`

| HTTP | code | 언제 | 앱 처리 |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | 구매 수량이 1~99가 아님, `ownedQuantity`가 음수거나 정수가 아님 | 메시지 표시 |
| 400 | `REWARD_001` | 재화 부족 | 메시지 표시 |
| 400 | `REWARD_006` | 사용할 부스터 없음 | 메시지 표시, 상점 안내 |
| 400 | `REWARD_007` | 3분 미만 세션의 보상 요청 | 메시지 표시 |
| 404 | `REWARD_004` | 보상 계정 없음 (보통 생기지 않음) | 잠시 후 재시도 |
| 404 | `REWARD_005` | 세션이 없거나 내 세션이 아님 | — |
| 404 | `SHOP_001` | 판매 중인 상품이 아님 | 상품 목록 다시 불러오기 |
| 409 | `SHOP_002` | 보낸 `ownedQuantity`가 서버의 그 상품 보유 개수와 다름 (재화는 차감되지 않음) | 재화와 보유 개수를 다시 조회해 안내, 자동으로 다시 구매하지 않음 (앱 반영 전) |
| 409 | `CONCURRENCY_001` | 같은 사용자 요청이 겹쳐 잠금 대기 3초 초과 (예: 구매 연타) | 잠시 후 재시도 |
| 400 | `QUEST_001` · `QUEST_002` | 정의만 있고 현재 쓰는 API 없음 | — |
