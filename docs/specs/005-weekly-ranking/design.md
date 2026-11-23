> 상태: approved (BE2 2026-11-23 · FE1 확인 대기: ⑤) · 작성: 2026-11-23 · 기준: feature/be2-ranking@9be251c · 담당: BE2 · 승인: BE2, FE1
> 요구사항: [requirements.md](./requirements.md)

# 005 · 주간 경험치 랭킹 — Design

## ① 흐름

```
[랭킹 화면] ── GET /api/rewards/rankings/weekly ──▶ RankingController
   └▶ RankingService.getWeeklyRanking(userId)
        1. 지금 한국 시간으로 이번 주(월~일) 계산 ─────────── RankingWeek
        2. 주 경계를 서버 시각으로 바꿈 (created_at이 서버 시각으로 저장되므로)
        3. 이번 주 INCOME_EXPERIENCE 합계 상위 30명 ──────── RewardTransactionRepository (집계 쿼리)
        4. 내 이번 주 경험치, 나보다 많은 사람 수 ──────────── RewardTransactionRepository
        5. 닉네임 조회 ─────────────────────────────── port UserNicknameReader → UserRepository (읽기만)
        6. 레벨 조회 ───────────────────────────────── RewardAccountRepository
        7. 동점 같은 순위(1, 2, 2, 4) 매기고 응답
```

- 읽기 전용이다. 보상 계정을 만들거나 방어권을 정산하지 않는다. 계정이 없는 사용자의 레벨은 1로 보여준다.
- 탈퇴하면 `RewardCleanupService`가 그 사용자의 `reward_transactions`를 지우므로 집계에 나오지 않는다 (R1.5). 닉네임을 찾을 수 없는 사용자는 목록에서 뺀다 (방어용).

### 응답

```json
{
  "weekStartDate": "2026-11-23",
  "weekEndDate": "2026-11-29",
  "rankings": [
    { "rank": 1, "nickname": "책벌레", "level": 7, "weeklyExperience": 540, "me": false },
    { "rank": 2, "nickname": "다독왕", "level": 5, "weeklyExperience": 320, "me": true },
    { "rank": 2, "nickname": "밤독서", "level": 9, "weeklyExperience": 320, "me": false },
    { "rank": 4, "nickname": "새내기", "level": 1, "weeklyExperience": 15, "me": false }
  ],
  "myRanking": { "rank": 2, "nickname": "다독왕", "level": 5, "weeklyExperience": 320 }
}
```

| 필드 | 설명 | R |
|---|---|---|
| `weekStartDate` · `weekEndDate` | 이번 주 월요일 · 일요일 (한국 날짜) | R1.3 |
| `rankings` | 최대 30개. 경험치 많은 순, 같으면 사용자 번호 작은 순 | R1.1, R3.4 |
| `rankings[].me` | 요청한 사용자 본인 항목이면 `true` (앱에서 강조용). 사용자 번호는 내보내지 않는다 | R1.2 |
| `myRanking.rank` | 이번 주 경험치가 0이면 `null` (순위 없음) | R2.1, R2.2 |

## ② 바뀌는 것

| 구분 | 변경 | 관련 R |
|---|---|---|
| API | 추가: `GET /api/rewards/rankings/weekly` (로그인 필요, 요청 본문·파라미터 없음) | R1, R2 |
| DB | 없음. 기존 `reward_transactions`(type, amount, created_at)를 집계한다 | R3.2 |
| 비즈니스 규칙 | 추가: 주간 랭킹 규칙 (아래) | R1~R3 |

### 규칙

| 규칙 | 값 | R |
|---|---|---|
| 점수 | 그 주 `reward_transactions` 중 `type = INCOME_EXPERIENCE`인 `amount` 합. 재화(`LEVEL_UP` 승급 보상 등)는 빠진다 | R3.2, R3.6 |
| 주 경계 | 한국 시간(`Asia/Seoul`) 월요일 0시 ≤ 지급 시각 < 다음 월요일 0시 | R3.1, R3.7 |
| 어느 주인가 | 지급 시각 `created_at` 기준 | R3.5 |
| 상위 인원 | 30명 | R1.1 |
| 0점 | 집계 행이 없으므로 순위에 안 나옴. 내 순위는 `null` | R1.4, R2.2 |
| 동점 순위 | 나보다 점수가 큰 사람 수 + 1 (1, 2, 2, 4) | R3.3 |
| 같은 순위 안 순서 | `user_id` 오름차순 | R3.4 |

### 시간대 처리 (R3.7)

`created_at`은 JPA Auditing이 서버 JVM 기본 시간대의 `LocalDateTime`으로 저장한다. 그래서 한국 시간 주 경계를 `ZonedDateTime`으로 만든 뒤 서버 기본 시간대의 `LocalDateTime`으로 바꿔서 조회한다. 서버가 UTC든 한국 시간이든 같은 순간을 경계로 쓴다.

## ③ 수정할 파일

| 파일 | 변경 내용 |
|---|---|
| `backend/.../reward/domain/RankingWeek.java` | 새로 만듦. 한국 날짜 → 그 주 월·일, 서버 시각 범위 계산 |
| `backend/.../reward/application/RankingService.java` | 새로 만듦. 집계·순위 매기기·응답 조립. 테스트용으로 기준 시각을 받는 메서드를 따로 둔다 |
| `backend/.../reward/application/WeeklyRankingResult.java` | 새로 만듦. 응답 결과 record |
| `backend/.../reward/application/port/UserNicknameReader.java` | 새로 만듦. 사용자 번호 목록 → 닉네임 |
| `backend/.../reward/infrastructure/RewardUserNicknameReader.java` | 새로 만듦. `UserRepository.findAllById`로 읽기만 함 (user 코드는 고치지 않음) |
| `backend/.../reward/infrastructure/RewardTransactionRepository.java` | 쿼리 3개 추가: 기간 내 경험치 합 상위 N명, 한 사용자의 기간 내 합, 기간 내 합이 주어진 값보다 큰 사용자 수 |
| `backend/.../reward/infrastructure/RewardAccountRepository.java` | `findAllByUserIdIn` 추가 (없으면) |
| `backend/.../reward/presentation/RankingController.java` | 새로 만듦. `GET /api/rewards/rankings/weekly` |
| `backend/src/test/.../reward/domain/RankingWeekTest.java` | 주 경계: 월요일 0시, 일요일 23:59, 서버 UTC일 때 |
| `backend/src/test/.../reward/application/RankingServiceTest.java` | 동점 순위, 내 순위(30위 밖·0점), 닉네임 없는 사용자 제외, 계정 없을 때 레벨 1 |
| `frontend/...` | 없음 (화면은 범위 밖) |

## ④ 고칠 docs 문서

- [x] `docs/domains/reward/api.md` — 목록에 랭킹 API 추가, 요청·응답 절
- [x] `docs/domains/reward/rules.md` — "랭킹" 절 추가 (위 규칙 표)
- [x] `docs/domains/reward/overview.md` — 핵심 개념·코드 위치·다른 도메인 연결(reward → user 닉네임 port)·현재 상태
- [x] `docs/known-issues.md` — TODO-6을 "레벨 해금"만 남기고 랭킹은 완료 처리
- [x] `docs/overview.md` — 기능 표의 랭킹 상태
- [x] `docs/architecture.md` — 도메인 연결 그림·표에 reward → user 닉네임 port

## ⑤ 남은 질문 (❓)

- ❓ 주소를 `GET /api/rewards/rankings/weekly`로 해도 되나? (보상 API가 `/api/rewards` 아래에 있어서 맞춤. FE1 확인)
- ❓ 응답의 `me` 표시와 `myRanking` 형태가 화면 만들기에 충분한가? (FE1 확인)

---

## 변경 기록

| 날짜 | 바뀐 내용 | 이유 | 결정 |
|---|---|---|---|
| 2026-11-23 | 닉네임 port 구현 이름 `UserRepositoryNicknameReader` → `RewardUserNicknameReader` | review에 같은 이름의 클래스가 있어 Spring 빈 이름이 겹침 (이름만 바뀜, API·규칙 같음) | BE2 |
