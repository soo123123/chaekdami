> 기준: main@82df578 + 스펙 004 + 스펙 005 · 최종 확인: 2026-11-23 · 담당: BE2

# reward — 보상

독서 활동을 **경험치·레벨·재화**로 바꾸고, 퀘스트·상점·부스터로 꾸준한 독서를 유도하는 도메인.

## 핵심 개념

| 개념 | 설명 | 자세히 |
|---|---|---|
| 보상 계정 | 사용자별 재화·누적 경험치·레벨·연속일. 보상 API를 처음 부를 때 자동 생성 | [data.md](./data.md#reward_accounts) |
| 독서 완료 보상 | 세션 1건마다 1번: 독서 경험치 + 퀘스트 진행·지급 + D-day 기록 + 레벨업 | [rules.md](./rules.md#1-독서-완료-보상) |
| 경험치·레벨 | 독서 시간·쪽수로 경험치, 구간마다 필요 경험치가 차면 레벨업, 승급 보상 재화 지급 | [rules.md](./rules.md#2-경험치) |
| 일일 퀘스트 | 날마다 사용자별로 출제. 달성하면 자동 지급(수령 API 없음) | [rules.md](./rules.md#4-일일-퀘스트) |
| 상점 | 방어권·경험치 부스터를 재화로 구매 | [rules.md](./rules.md#5-상점) |
| 부스터 | 30분 동안 독서 경험치 2배. 겹친 시간 비율만큼 적용 | [rules.md](./rules.md#3-경험치-부스터) |
| 방어권 | 놓친 날을 자동으로 막아 연속 기록 유지 | [dday/rules.md](../dday/rules.md) |
| 변동 이력 | 재화·경험치가 바뀔 때마다 기록. 중복 지급 방지에도 사용 | [data.md](./data.md#reward_transactions) |
| 주간 랭킹 | 이번 주(한국 시간 월~일) 받은 경험치 합으로 상위 30명과 내 순위 | [rules.md](./rules.md#8-주간-랭킹) |

## 코드 위치

```
backend/src/main/java/com/chaekdami/reward/
├── presentation/    RewardController, ReadingSessionRewardController, BoosterController, RankingController,
│                    QuestController, ShopController, dto/
├── application/     ReadingSessionRewardService(독서 완료 보상), RewardService, QuestService,
│                    ShopService, BoosterService, StreakService, RankingService(주간 랭킹), RewardLedger(잠금·지급·이력),
│                    port/(ReadingSessionReader, PhotoCertificationChecker, UserNicknameReader)
├── domain/          ExperiencePolicy, LevelPolicy, DailyQuest, DailyQuestPicker, StreakCalculator, RankingWeek,
│                    RewardErrorCode, 엔티티
└── infrastructure/  Repository, DailyQuestSeeder, ShopItemSeeder,
                     ReadingSessionRepositoryReader, CertificationPhotoChecker, RewardUserNicknameReader,
                     RewardCleanupListener
```

프론트: `frontend/src/features/fe2/api/rewardApi.ts`, 화면 `RewardScreen` · `QuestScreen` · `ShopScreen` · `ReadingCompleteScreen` (FE2)

## 다른 도메인과의 연결

| 방향 | 무엇 | 방식 |
|---|---|---|
| reward → reading | 세션의 독서 시간·쪽수·종료 시각 조회 | port `ReadingSessionReader` |
| reward → reading | 사진 인증 여부 | port `PhotoCertificationChecker` → `CertificationPhotoChecker`가 `CertificationService.isPhotoCertified` 호출 |
| reward ↔ dday | 읽은 날 기록, 방어권 정산, 연속일 계산 | 직접 참조 (`DdayService`, `StreakService`) |
| reward → user | 랭킹에 보여줄 닉네임 조회 | port `UserNicknameReader` → `RewardUserNicknameReader` (`UserRepository` 읽기만) |
| user → reward | 회원 탈퇴 시 보상 데이터 삭제 | 이벤트 `UserWithdrawnEvent` → `RewardCleanupListener` |
| 앱 | 세션 저장 후 독서 완료 화면에서 보상 API 호출 | [architecture.md](../../architecture.md#41-독서--보상) |

## 현재 상태

- ✅ 보상 상태, 독서 완료 보상, 일일 퀘스트, 상점, 부스터, 방어권 자동 정산, 주간 랭킹 ([specs/005](../../specs/005-weekly-ranking/))
- ⚠️ [ISSUE-DATA-3](../../known-issues.md#issue-data-3) 책 삭제 시 보상 내역이 지워진 세션을 가리킨 채 남음
- ⏳ [TODO-5](../../known-issues.md#todo-5) 주간 퀘스트 — `QuestType.WEEKLY` 값만 있음
- ⏳ [TODO-6](../../known-issues.md#todo-6) 레벨 해금 — 미구현
- ⏳ [TODO-19](../../known-issues.md#todo-19) reward ↔ dday 직접 참조
- 결정 배경: [decisions/0003](../../decisions/0003-reward-on-complete-screen.md), [decisions/0004](../../decisions/0004-dday-records.md)
