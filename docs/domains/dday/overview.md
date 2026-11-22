> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE2

# dday — D-day 목표와 연속 독서

사용자가 정한 **독서 목표(목표 날짜·권수)** 와, 날마다 읽었는지 기록하는 **D-day 달력**을 관리하는 도메인. 연속 독서 일수와 방어권 처리는 이 달력 하나를 기준으로 한다.

## 핵심 개념

| 개념 | 설명 | 자세히 |
|---|---|---|
| D-day 목표 | 제목, 목표 날짜, 목표 권수, 완료 권수. 사용자당 여러 개 | [rules.md](./rules.md#1-목표) |
| D-day 달력 | 날짜별 `read`(읽음) 또는 `protected`(방어권으로 지킴). **서버만 기록** | [rules.md](./rules.md#2-달력) |
| 연속 독서 일수 | 읽은 날 +1, 방어한 날 +0, 기록 없는 날에서 끊김 | [rules.md](./rules.md#3-연속-일수와-방어권) |
| 방어권 자동 정산 | 놓친 날마다 방어권 1개를 자동으로 써서 `protected`로 기록 | [rules.md](./rules.md#3-연속-일수와-방어권) |

## 코드 위치

```
backend/src/main/java/com/chaekdami/dday/
├── presentation/    DdayController, dto/
├── application/     DdayService
├── domain/          DdayGoal, DdayRecord, DdayRecordStatus
└── infrastructure/  DdayGoalRepository, DdayRecordRepository, DdayCleanupListener
```

연속 일수 계산과 방어권 정산은 reward 패키지에 있다: `reward/application/StreakService`, `reward/domain/StreakCalculator`

프론트 (FE2): `features/fe2/api/ddayApi.ts`, `ddayStreak.ts`, 화면 `DdayScreen` (달력은 보기 전용)

## 다른 도메인과의 연결

| 방향 | 무엇 | 방식 |
|---|---|---|
| reward → dday | 독서 완료 보상 때 세션 날짜를 "읽음"으로 기록 | 직접 호출 `DdayService.markRead` |
| dday → reward | 조회 때 방어권 정산, 연속 일수 계산 | 직접 호출 `StreakService` |
| user → dday | 회원 탈퇴 시 목표·달력 삭제 | 이벤트 `UserWithdrawnEvent` → `DdayCleanupListener` |

## 현재 상태

- ✅ 목표 저장·조회, 서버 기록 달력, 연속 일수, 방어권 자동 정산·환불
- ⏳ [TODO-12](../../known-issues.md#todo-12) 목표의 완료 권수는 사용자가 입력 (완독과 자동 연결 안 됨), 독서 통계의 목표 달성(`goalBooks`)과도 미연결
- ⏳ [TODO-22](../../known-issues.md#todo-22) `DdayService.markTodayRead`는 호출하는 곳이 없다 (`markRead`로 대체됨)
- 결정 배경: [decisions/0004](../../decisions/0004-dday-records.md)
