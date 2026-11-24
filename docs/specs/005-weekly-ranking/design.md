> 상태: in-progress (BE2 승인 2026-11-23) · 작성: 2026-11-23 · 기준: feature/be2-ranking@9be251c · 담당: BE2 · 승인: BE2
> 요구사항: [requirements.md](./requirements.md)

예외: S6의 "영향받는 파트 담당 1명"(FE1)의 승인 없이 BE2만 확인하고 진행했다 (사람 결정 2026-11-24).

# 005 · 주간 랭킹 (경험치·독서 시간) — Design

## ① 흐름

```
[랭킹 화면] ── GET /api/rewards/rankings/weekly/experience ───▶ RankingController
           └─ GET /api/rewards/rankings/weekly/reading-time ─▶ RankingController
   └▶ RankingService.getWeeklyExperienceRanking / getWeeklyReadingTimeRanking (userId)
        1. 지금 한국 시간으로 이번 주(월~일) 계산 ─────────── RankingWeek
        2. 주 경계를 서버 시각으로 바꿈 (시각 컬럼이 서버 시각으로 저장되므로)
        3. 점수 출처에서 상위 30명, 내 점수, 나보다 높은 사람 수
             경험치   → RewardTransactionRepository (INCOME_EXPERIENCE, created_at)
             독서 시간 → port WeeklyReadingTimeReader → ReadingSessionTimeReader (reading_sessions, ended_at)
        4. 닉네임 조회 ─────────────────────────────── port UserNicknameReader → UserRepository (읽기만)
        5. 레벨 조회 ───────────────────────────────── RewardAccountRepository
        6. 동점 같은 순위(1, 2, 2, 4) 매기고 응답
```

- 두 랭킹은 점수 출처만 다르고 순위 매기기·응답 모양은 같다.
- 읽기 전용이다. 보상 계정을 만들거나 방어권을 정산하지 않는다. 계정이 없는 사용자의 레벨은 1로 보여준다.
- 탈퇴하면 `RewardCleanupService`가 `reward_transactions`를, `ReadingCleanupListener`가 `reading_sessions`를 지우므로 집계에 나오지 않는다 (R1.5). 닉네임을 찾을 수 없는 사용자는 목록에서 뺀다 (방어용).
- 독서 시간 집계는 reward 쪽 구현(`ReadingSessionTimeReader`)이 `ReadingSession` 엔티티를 JPQL로 읽기만 한다. reading(BE1) 코드는 고치지 않는다.

### 응답 (두 API 같은 모양)

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

| 필드 | 설명 | R |
|---|---|---|
| `weekStartDate` · `weekEndDate` | 이번 주 월요일 · 일요일 (한국 날짜) | R1.3 |
| `rankings` | 최대 30개. 점수 높은 순, 같으면 사용자 번호 작은 순 | R1.1, R4.1, R3.4 |
| `score` | 경험치 랭킹: 이번 주 경험치 / 독서 시간 랭킹: 이번 주 독서 시간(**초**) | R1.2 |
| `rankings[].me` | 요청한 사용자 본인 항목이면 `true` (앱에서 강조용). 사용자 번호는 내보내지 않는다 | R1.2 |
| `myRanking.rank` | 이번 주 점수가 0이면 `null` (순위 없음) | R2.1, R2.2 |

## ② 바뀌는 것

| 구분 | 변경 | 관련 R |
|---|---|---|
| API | 추가: `GET /api/rewards/rankings/weekly/experience`, `GET /api/rewards/rankings/weekly/reading-time` (로그인 필요, 요청 본문·파라미터 없음) | R1, R2, R4 |
| DB | 없음. 기존 `reward_transactions`(type, amount, created_at)와 `reading_sessions`(user_id, duration_seconds, ended_at)를 집계한다 | R3.2, R4.2 |
| 비즈니스 규칙 | 추가: 주간 랭킹 규칙 (아래) | R1~R4 |

### 규칙

| 규칙 | 경험치 랭킹 | 독서 시간 랭킹 | R |
|---|---|---|---|
| 점수 | 그 주 `reward_transactions` 중 `INCOME_EXPERIENCE` 금액 합. 재화(`LEVEL_UP` 승급 보상 등)는 빠진다 | 그 주 `reading_sessions.duration_seconds` 합 (초) | R3.2, R3.6, R4.2 |
| 어느 주인가 | 지급 시각 `created_at` | 세션 종료 시각 `ended_at` (서버가 저장 요청을 받은 시각) | R3.5, R4.3 |
| 주 경계 | 한국 시간(`Asia/Seoul`) 월요일 0시 ≤ 시각 < 다음 월요일 0시 | 같음 | R3.1, R3.7 |
| 상위 인원 | 30명 | 같음 | R1.1, R4.1 |
| 0점 | 집계 행이 없으므로 순위에 안 나옴. 내 순위는 `null` | 같음 | R1.4, R2.2 |
| 동점 순위 | 나보다 점수가 큰 사람 수 + 1 (1, 2, 2, 4) | 같음 | R3.3 |
| 같은 순위 안 순서 | `user_id` 오름차순 | 같음 | R3.4 |
| 책 삭제 | 경험치 이력은 남아 점수 유지 (ISSUE-DATA-3) | 세션이 지워져 점수에서 빠짐 | R4.4 |

### 시간대 처리 (R3.7)

`created_at`(JPA Auditing)과 `ended_at`(서버가 받은 시각)은 서버 JVM 기본 시간대의 `LocalDateTime`으로 저장된다. 그래서 한국 시간 주 경계를 `ZonedDateTime`으로 만든 뒤 서버 기본 시간대의 `LocalDateTime`으로 바꿔서 조회한다. 서버가 UTC든 한국 시간이든 같은 순간을 경계로 쓴다.

## ③ 수정할 파일

| 파일 | 변경 내용 |
|---|---|
| `backend/.../reward/domain/RankingWeek.java` | 새로 만듦. 한국 날짜 → 그 주 월·일, 서버 시각 범위 계산 |
| `backend/.../reward/application/RankingService.java` | 새로 만듦. 점수 출처 2개, 순위 매기기·응답 조립. 테스트용으로 기준 시각을 받는 메서드를 따로 둔다 |
| `backend/.../reward/application/WeeklyRankingResult.java` | 새로 만듦. 응답 결과 record (`score`) |
| `backend/.../reward/application/port/UserNicknameReader.java` | 새로 만듦. 사용자 번호 목록 → 닉네임 |
| `backend/.../reward/application/port/WeeklyReadingTimeReader.java` | 새로 만듦. 기간 내 독서 시간 상위 N명·한 사용자 합·더 큰 사용자 수 |
| `backend/.../reward/infrastructure/RewardUserNicknameReader.java` | 새로 만듦. `UserRepository.findAllById`로 읽기만 함 (user 코드는 고치지 않음) |
| `backend/.../reward/infrastructure/ReadingSessionTimeReader.java` | 새로 만듦. port 구현 |
| `backend/.../reward/infrastructure/ReadingSessionTimeQueryRepository.java` | 새로 만듦. `ReadingSession` 읽기 전용 집계 쿼리 3개 (`@Query`라 앱 시작 때 문법 검사됨). reading의 `ReadingSessionRepository`는 고치지 않음 |
| `backend/.../reward/infrastructure/RewardTransactionRepository.java` | 쿼리 3개 추가: 기간 내 경험치 합 상위 N명, 한 사용자의 기간 내 합, 기간 내 합이 주어진 값보다 큰 사용자 수 |
| `backend/.../reward/infrastructure/RewardAccountRepository.java` | `findAllByUserIdIn` 추가 |
| `backend/.../reward/presentation/RankingController.java` | 새로 만듦. `GET /api/rewards/rankings/weekly/experience`, `/weekly/reading-time` |
| `backend/src/test/.../reward/domain/RankingWeekTest.java` | 주 경계: 월요일 0시, 일요일 23:59, 서버 UTC일 때 |
| `backend/src/test/.../reward/application/RankingServiceTest.java` | 동점 순위, 내 순위(30위 밖·0점), 닉네임 없는 사용자 제외, 계정 없을 때 레벨 1, 독서 시간 랭킹 |
| (프론트) | 없음. 화면은 범위 밖 |

## ④ 고칠 docs 문서

- [x] `docs/domains/reward/api.md` — 목록에 랭킹 API 2개 추가, 요청·응답 절
- [x] `docs/domains/reward/rules.md` — "주간 랭킹" 절 (위 규칙 표)
- [x] `docs/domains/reward/overview.md` — 핵심 개념·코드 위치·다른 도메인 연결(reward → user 닉네임, reward → reading 독서 시간)·현재 상태
- [x] `docs/known-issues.md` — TODO-6에서 서버 랭킹은 완료, 화면·레벨 해금만 남김
- [x] `docs/overview.md` — 기능 표의 랭킹 상태
- [x] `docs/architecture.md` — 도메인 연결 그림·표에 두 port

## ⑤ 남은 질문 (❓)

- ❓ 주소 `GET /api/rewards/rankings/weekly/experience`·`/weekly/reading-time`과 응답 모양(`score`, `me`, `myRanking`)이 화면 만들기에 충분한가? (FE1 확인)

---

## 변경 기록

| 날짜 | 바뀐 내용 | 이유 | 결정 |
|---|---|---|---|
| 2026-11-23 | 닉네임 port 구현 이름 `UserRepositoryNicknameReader` → `RewardUserNicknameReader` | review에 같은 이름의 클래스가 있어 Spring 빈 이름이 겹침 (이름만 바뀜, API·규칙 같음) | BE2 |
| 2026-11-23 | 랭킹 2개로 확장: API를 `/weekly` 하나에서 `/weekly/experience`·`/weekly/reading-time` 두 개로, 응답의 `weeklyExperience`를 `score`로, 독서 시간 port 추가 | 팀 기획(TODO-6, PR #15)이 독서 랭킹을 포함. 경험치·독서 시간 랭킹을 따로 둔다 (requirements R4) | BE2 |
