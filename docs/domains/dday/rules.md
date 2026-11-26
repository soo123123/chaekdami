> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-24 · 담당: BE2

# dday 규칙

## 1. 목표

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 개수 | 사용자당 최대 30개 | `DdayService.MAX_GOALS` | ✅ |
| 제목 | 앞뒤 공백 제거 후 1~100자 | `DdayService.MAX_TITLE_LENGTH` | ✅ |
| 목표 권수 | 1~999 | `DdayService.MAX_BOOKS` | ✅ |
| 완료 권수 | 0~목표 권수. 사용자가 입력 | `DdayService.saveGoals` | ✅ ⏳ [TODO-12](../../known-issues.md#todo-12) |
| 저장 방식 | 보낸 목록이 전체. id 있으면 수정, 없으면 추가, 빠진 것은 삭제 | `DdayService.saveGoals` | ✅ |

## 2. 달력

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 기록 주체 | **서버만** 기록. 클라이언트가 보낸 `records`는 무시 (방어권 없이 "방어"를 만들지 못하게) | `DdayService.save` | ✅ |
| "읽음" 기록 | 독서 완료 보상 때 **세션 종료 날짜**로 기록 (자정 넘어 완료 화면을 열어도 독서한 날) | `DdayService.markRead` ← `ReadingSessionRewardService` | ✅ |
| "방어" 기록 | 방어권 자동 정산 때 | `StreakService.settleBefore` | ✅ |
| 하루 한 건 | UNIQUE (user_id, record_date). 방어였던 날이 읽음으로 바뀔 수 있음 | `DdayRecord` | ✅ |

## 3. 연속 일수와 방어권

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 연속 계산 | 읽은 날 +1, 방어한 날 +0, 기록 없는 날에서 끊김 | `StreakCalculator.summarize` | ✅ |
| 현재 연속 | 오늘 기록이 있으면 오늘까지, 없으면 어제까지 | `StreakCalculator.summarize` | ✅ |
| 정산 시점 | 배치 없음. `GET /api/dday`, `GET /api/rewards`, 독서 완료 보상 때 그 자리에서 | `StreakService.settleBefore` | ✅ |
| 정산 범위 | 마지막 기록 다음 날 ~ 기준일 전날의 빈 날마다 방어권 1개 | `StreakService.settleBefore` | ✅ |
| 방어권 부족 | 떨어지면 거기서 멈추고, 남은 빈 날 때문에 연속이 끊긴다 | `StreakService.settleBefore` | ✅ |
| 연속 0일 때 | 지킬 기록이 없으므로 방어권을 쓰지 않음 | `StreakService.settleBefore` | ✅ |
| 환불 | 읽음으로 기록하려는 날이 이미 "방어"면 그 방어권 1개를 돌려줌 (보상이 늦게 처리된 경우) | `StreakService.refundShieldIfProtected` | ✅ |
| 계정 반영 | 독서 완료 보상 때만 계산한 값을 `reward_accounts.dday`·`max_dday`에 반영 (캐시). 조회는 저장하지 않음 | `RewardAccount.syncStreak` | ✅ |

### 예시

```
11/17 read · 11/18 (없음) · 11/19 (없음) · 11/20 독서 완료 보상, 방어권 1개 보유
→ 11/18을 protected로 (방어권 1개 사용), 11/19는 방어권이 없어 빈 날로 남음
→ 11/20 read 기록 → 11/19에서 끊겨 현재 연속 1일
```
