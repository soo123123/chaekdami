> 기준: feature/014-reading-reminder (스펙 014) · 최종 확인: 2026-11-28 · 담당: BE3

# reminder API

공통 규칙: [conventions/api.md](../../conventions/api.md). 로그인 필요. 사용자는 토큰으로 정한다 (`CurrentUser`, `X-User-Id` 쓰지 않음).

## 목록

| 메서드 | 경로 | 설명 | 성공 | 상태 |
|---|---|---|---|---|
| GET | `/api/me/reminder-status` | 알림 예약에 필요한 값과 설정 | 200 | ✅ |
| PUT | `/api/me/reminder-settings` | 알림 설정 저장 | 200 | ✅ |

---

## GET /api/me/reminder-status

**놓친 날이 있으면 방어권 자동 정산을 먼저 처리**하므로 조회지만 데이터가 바뀔 수 있다 (보상·D-day 조회와 같음).

코드: `ReminderController.status` → `ReminderStatusService.get`

```json
{
  "today": "2026-11-28",
  "weekStart": "2026-11-23",
  "readToday": false,
  "weekReadDates": ["2026-11-24", "2026-11-26"],
  "todayMinutes": 0,
  "weekMinutes": 260,
  "currentStreak": 5,
  "ownedShieldCount": 1,
  "nickname": "책벌레",
  "settings": { "enabled": true, "earlyLateMuted": false, "weeklyGoalMinutes": 300 }
}
```

| 필드 | 설명 |
|---|---|
| `today`, `weekStart` | 한국 날짜. 주는 월요일 시작 |
| `readToday`, `weekReadDates` | 세션 **종료 시각**의 한국 날짜 기준. 자정을 넘긴 독서는 끝난 날 |
| `todayMinutes`, `weekMinutes` | 초를 모두 더한 뒤 분으로 내림 |
| `currentStreak` | 방어권 정산 뒤 연속 일수. 오늘 기록이 없으면 어제까지 |
| `ownedShieldCount` | 남은 방어권 수 |
| `nickname` | 회원이 없으면 빈 문자열 |
| `settings` | 저장한 적이 없으면 기본값 (저장하지 않음) |

## PUT /api/me/reminder-settings

코드: `ReminderController.saveSettings` → `ReminderSettingService.save`

```json
{ "enabled": true, "earlyLateMuted": false, "weeklyGoalMinutes": 300 }
```

| 필드 | 규칙 |
|---|---|
| `enabled` | 필수. 끄면 앱이 아무 알림도 예약하지 않음 |
| `earlyLateMuted` | 필수. 켜면 이른 아침·늦은 저녁 알림(주말 아침 09:00, 연속 독서 21:30)을 보내지 않음 |
| `weeklyGoalMinutes` | 필수. 30~3000 |

응답: 저장된 설정 (요청과 같은 모양).

## 에러 코드

| HTTP | code | 언제 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 값이 빠짐, 주간 목표가 30 미만·3000 초과 (`fields` 있음) |
| 401 | `UNAUTHORIZED` | 로그인 안 됨 |

예시: `backend/http/reminder.http`
