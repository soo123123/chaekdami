> 상태: in-progress (BE2 승인 2026-11-25 · FE2 2026-11-25 메시지 답변) · 작성: 2026-11-25 · 기준: feature/013-weekly-quest@1e66a58 · 담당: BE2 · 승인: BE2, FE2
> 요구사항: [requirements.md](./requirements.md)

# 013 · 주간 퀘스트 — Design

## ① 흐름

```
[퀘스트·홈 화면] ── GET /api/quests ─▶ QuestService.getTodayQuests
   └ 오늘의 일일 퀘스트(없으면 만듦) + 이번 주 주간 퀘스트(없으면 만듦), 일일 먼저

[독서 완료] ── POST /api/rewards/reading-sessions/{id} ─▶ ReadingSessionRewardService ─▶ QuestService.recordReadingSession(세션 종료 시각)
   1. 보상 계정 잠금
   2. 세션 종료 날짜의 일일 퀘스트 + 세션 종료 시각이 속한 주의 주간 퀘스트
      (오늘·이번 주면 없을 때 만들고, 지난 날·지난 주면 이미 있는 것만)
   3. 진행도 반영 → 달성하면 바로 지급 (이력에 사용자 퀘스트 번호)
```

- 주간 퀘스트는 코드 목록 `WeeklyQuest`로 정하고, 앱 시작 때 DB를 맞춘다 (일일의 `DailyQuest`·`DailyQuestSeeder`와 같은 방식).
- 어느 주의 퀘스트인지는 `user_quests.created_at`으로 구분한다 (일일이 날짜를 구분하는 방식과 같음). 조회할 때 **종류(`DAILY`·`WEEKLY`)로 나눠** 찾으므로 서로 영향을 주지 않는다 (R1.5).
- 없을 때는 보상 계정을 잠그고 다시 확인한 뒤 만든다 (R1.4). 일일과 주간을 같은 잠금 안에서 만든다.
- 주 경계는 스펙 005의 `RankingWeek`(한국 시간 월요일 0시, 서버 시각으로 변환)를 쓴다.
- 기본 보상이 세션당 1번이라 진행도도 세션당 1번만 반영된다 (R2.5).

## ② 바뀌는 것

| 구분 | 변경 | 관련 R |
|---|---|---|
| API | 주소·필드 없음. `GET /api/quests`에 `type: WEEKLY` 항목이 일일 다음에 추가됨. 독서 완료 보상의 `completedQuests`에 주간 퀘스트가 들어갈 수 있음 | R3 |
| DB | 테이블·컬럼 없음. `quests`에 주간 퀘스트 3행 추가 (앱 시작 때) | R1.2 |
| DB | 퀘스트 보상 이력의 `reward_transactions.reference_id`에 `user_quests.id`를 저장 (전에는 NULL). 옛 이력은 그대로 | R4 |
| 비즈니스 규칙 | 주간 퀘스트 추가 (아래) | R1, R2 |

| 규칙 | 값 |
|---|---|
| 코드 | `WEEKLY_SESSION_5`, `WEEKLY_READING_100_MINUTES`, `WEEKLY_READING_200_MINUTES` |
| 출제 | 매주 전부 (랜덤 없음) |
| 이력 사유 | `DAILY_QUEST` (일일·주간 공통). 구분은 `reference_id` → `user_quests` → `quests.type` |

- `quests.type`의 값 `WEEKLY`는 테이블을 처음 만들 때부터 있던 값이라(`b7e791d`) 제약 변경이 필요 없을 것으로 본다. 팀 DB에서 실제로 확인하지는 않았다 (작업 9.4).
- 같은 퀘스트 보상이 두 번 기록되는 것은 이미 있는 UNIQUE(user_id, type, reason, reference_id)가 막는다 (R4.2).

## ③ 수정할 파일

| 파일 | 변경 내용 |
|---|---|
| `backend/.../reward/domain/WeeklyQuest.java` | 새로 만듦. 주간 퀘스트 목록 |
| `backend/.../reward/infrastructure/WeeklyQuestSeeder.java` | 새로 만듦. 앱 시작 때 `quests`를 목록에 맞춤 |
| `backend/.../reward/infrastructure/UserQuestRepository.java` | 종류별 기간 조회 |
| `backend/.../reward/application/QuestService.java` | 주간 생성·진행·지급, 날짜 대신 세션 종료 시각을 받음 |
| `backend/.../reward/application/RewardLedger.java` | 대상 번호를 남기는 재화 지급 |
| `backend/.../reward/application/ReadingSessionRewardService.java` | 세션 종료 시각을 넘김 (한 줄) |
| `backend/.../reward/domain/TransactionReason.java` | `DAILY_QUEST`가 퀘스트 공통이라는 주석 |
| `backend/src/test/.../reward/application/QuestServiceTest.java` | 주간 진행·지급, 종류별 조회, 지난 주 세션 |
| `backend/src/test/.../reward/application/ReadingSessionRewardServiceTest.java` | 바뀐 호출에 맞춤 |
| `backend/src/test/.../reward/application/RewardLedgerTest.java` | 대상 번호 기록 |
| `backend/src/test/.../reward/application/WeeklyQuestTest.java` | 새로 만듦. H2에서 동시 첫 요청, 이력 번호, 일일 영향 없음 |
| `backend/src/test/.../reward/infrastructure/WeeklyQuestSeederTest.java` | 새로 만듦 |
| (프론트) | 없음. FE2 답에 따라 별도 항목 |

- **`RankingWeek`는 PR 35(`feature/be2-ranking`)에 있다.** 그 브랜치를 먼저 받아 쌓아서 구현하고, PR은 35가 병합된 뒤에 올린다.
- `RewardLedger.java`·`RewardLedgerTest.java`는 PR 42(`fix/be2-account-create`)와, `ReadingSessionRewardService.java`·`ReadingSessionRewardServiceTest.java`는 PR 34(`fix/be2-photo-reward-tx`)와 함께 고치는 파일이다.

## ④ 고칠 docs 문서

- [x] `docs/domains/reward/rules.md` — 4장에 주간 퀘스트 규칙과 목록
- [x] `docs/domains/reward/api.md` — `GET /api/quests`
- [x] `docs/domains/reward/data.md` — `quests`, `user_quests`, `reward_transactions.reference_id`, 변경 이력
- [x] `docs/domains/reward/overview.md` — 핵심 개념, 현재 상태(TODO-5 표시)
- [x] `docs/glossary.md` — 퀘스트 종류 "주간은 미사용"
- [x] `docs/overview.md` — 기능 표의 주간 퀘스트

## ⑤ 남은 질문 (❓)

- 없음. 독서 완료 화면은 일일만 표시하고 주간은 합계에만 넣는다 (FE2 2026-11-25). 마이페이지는 제목의 `30분`을 찾는데, 주간 제목에는 `30분`이 없어 영향이 없다 (코드 확인).

---

## 변경 기록

| 날짜 | 바뀐 내용 | 이유 | 결정 |
|---|---|---|---|
| | | | |
