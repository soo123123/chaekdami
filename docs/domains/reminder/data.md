> 기준: feature/014-reading-reminder (스펙 014) · 최종 확인: 2026-11-28 · 담당: BE3

# reminder 데이터

테이블은 JPA 엔티티로 생성된다 (`ddl-auto=update`). `BaseTimeEntity` (`created_at`, `updated_at`).
`users`와 FK가 없어서 회원 탈퇴 시 `ReminderCleanupListener`가 지운다.
독서 여부·독서량·연속 일수는 저장하지 않고 다른 도메인의 기록에서 계산한다.

## reminder_settings

엔티티: `ReminderSetting`. 회원마다 한 행. 행이 없으면 기본값으로 보고 만들지 않는다.

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | bigint | PK | |
| user_id | bigint | not null, UNIQUE `uk_reminder_settings_user_id` | |
| enabled | boolean | not null, 기본 true | 독서 알림 받기 |
| early_late_muted | boolean | not null, 기본 false | 이른 아침·늦은 저녁 알림 끄기 |
| weekly_goal_minutes | int | not null, 기본 300 | 주간 목표 (30~3000분) |
| created_at, updated_at | timestamp | not null | |

- 처음 저장이 동시에 일어나 UNIQUE에 걸리면 한 번 다시 읽어 고친다 (`ReminderSettingService.save`)
- 실제 PostgreSQL에서 테이블·기본값이 만들어지는지는 병합 전에 확인한다 (스펙 014 tasks 5.3)

## 기기에 저장하는 값 (앱)

| 키 | 저장소 | 설명 |
|---|---|---|
| `reminder.goalNearDate` | `expo-secure-store` | 주간 목표 임박 알림을 예약한 날. 같은 주에 두 번 보내지 않으려고 쓴다 |
| 예약된 알림 | OS (`expo-notifications`) | identifier `reminder:<번호>:<YYYY-MM-DD>` |
