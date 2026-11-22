> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# 0004 · 연속 독서 기준을 D-day 달력 하나로

- 상태: 채택 · 커밋 `39219cd`, `891e313` · 결정: BE2 · 스펙: [001](../specs/001-reward-integration/)

## 예전 설계
`streak_logs`(achieved_date, shield_used)에 하루 기록. 연속일은 `reward_accounts.dday`에 누적.
한때는 세션 저장 때 `DdayService.markTodayRead`와 보상 쪽 `StreakService` 두 곳에서 연속을 따로 관리했다.

## 바꾼 이유
두 곳에서 관리하면 값이 어긋난다. 클라이언트가 달력을 보내 "방어" 날을 만들 수 있는 문제도 있었다.

## 지금 방식
- `dday_records`(READ · PROTECTED) 하나가 유일한 기준. **서버만 기록**
- 연속일은 매번 달력으로 계산 (읽은 날 +1, 방어한 날 +0), `reward_accounts.dday`는 캐시
- 방어권은 조회·보상 때 놓친 날마다 자동 사용, 나중에 읽음으로 바뀌면 환불

## 영향
- `PUT /api/dday`의 `records`는 무시된다
- 자세히: [domains/dday/rules.md](../domains/dday/rules.md)
