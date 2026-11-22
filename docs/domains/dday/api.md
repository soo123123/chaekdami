> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE2

# dday API

공통 규칙: [conventions/api.md](../../conventions/api.md). 로그인 필요. `X-User-Id`는 보내지 않아도 된다.

## 목록

| 메서드 | 경로 | 설명 | 성공 | 상태 |
|---|---|---|---|---|
| GET | `/api/dday` | 목표와 달력, 연속 일수 | 200 | ✅ |
| PUT | `/api/dday` | 목표 저장 (전체 교체) | 200 | ✅ |

---

## GET /api/dday

**놓친 날이 있으면 방어권 자동 정산을 먼저 처리**하므로 조회지만 데이터가 바뀔 수 있다.

코드: `DdayController.get` → `DdayService.get`

```json
{
  "goals": [
    { "id": 3, "title": "11월 5권 읽기", "targetDate": "2026-11-30", "targetBooks": 5, "completedBooks": 2 }
  ],
  "records": {
    "2026-11-18": "read",
    "2026-11-19": "protected",
    "2026-11-20": "read"
  },
  "currentStreak": 2,
  "longestStreak": 9
}
```

| 필드 | 설명 |
|---|---|
| `goals` | 목표 날짜, id 순 |
| `records` | 날짜 → `read` · `protected`. 기록 없는 날은 키가 없다 |
| `currentStreak` | 오늘(오늘 기록이 없으면 어제)까지 이어진 연속 일수 |
| `longestStreak` | 지금까지 가장 긴 연속 일수 |

## PUT /api/dday

**목표만** 저장한다. 보낸 목록이 전체가 된다: `id`가 있으면 수정, 없으면 추가, 목록에 없는 기존 목표는 삭제.
`records`를 보내도 **무시한다** (달력은 서버만 기록). 응답은 GET과 같다.

```json
{
  "goals": [
    { "id": 3, "title": "11월 5권 읽기", "targetDate": "2026-11-30", "targetBooks": 5, "completedBooks": 3 },
    { "title": "12월 3권", "targetDate": "2026-12-31", "targetBooks": 3, "completedBooks": 0 }
  ]
}
```

---

## 에러 코드

dday는 도메인 에러 코드가 없다. 검증 실패는 400 `VALIDATION_ERROR` (`message`로 구분).

| message | 언제 |
|---|---|
| 목표는 30개까지 저장할 수 있습니다. | 목표 30개 초과 |
| 목표 제목은 1자 이상 100자 이하여야 합니다. | 제목 |
| 목표 날짜를 입력해야 합니다. | `targetDate` 없음 |
| 목표 권수와 완료 권수를 확인해 주세요. | 권수 범위 |
| 같은 목표를 두 번 보냈습니다. | 같은 `id` 중복 |
