> 상태: approved · 작성: 2026-11-28 · 기준: main@531cb3e · 담당: BE3 · 승인: BE3 (2026-11-28)
> 요구사항: [requirements.md](./requirements.md)

# 014 · reading-reminder — Design

> 이 브랜치(`feature/014-reading-reminder`)는 main@24d6105에서 갈라졌다. 구현 전에 최신 main을 이 브랜치에 받아야 한다 (병합은 사람이 한다). 아래 경로·코드는 main@531cb3e 기준이다.

## ① 흐름

```
[앱이 열림·화면 복귀·로그인] ─┐
[독서 저장 성공 (useReadingEnd)] ─┼─▶ rescheduleReminders()  (한 번에 하나씩, 겹치면 마지막 요청만 한 번 더)
[보상 처리 성공 (useReadingComplete)] ─┤      1. GET /api/me/reminder-status ──▶ ReminderController ─▶ ReminderStatusService
[알림 설정 저장 (FE2 화면)] ─┘                 │      ├ ReminderSettingRepository (없으면 기본값)
                                                │      ├ ReminderReadingReader ─▶ reading_sessions (종료 시각, 한국 시간)
                                                │      ├ ReminderStreakReader  ─▶ StreakService.settleBefore → summarize, 방어권 수
                                                │      └ ReminderUserReader    ─▶ users.nickname
                                                2. buildReminderPlan(status, now)  (순수 함수: 알림 목록·겹침 규칙·해제 조건)
                                                3. 우리 알림(identifier "reminder:")만 모두 취소 → 계획대로 예약 (expo-notifications)

[독서 시작 (ReadingStartScreen)] ─▶ 오늘의 1·2·4번 취소                          R8.3
[clearTokens() = 로그아웃·탈퇴·세션 만료·재발급 실패] ─▶ 우리 알림 모두 취소       R3
[알림 설정 화면 (FE2)] ── PUT /api/me/reminder-settings ──▶ ReminderSettingService ─▶ 저장 → rescheduleReminders()
[회원 탈퇴] ─ UserWithdrawnEvent ─▶ ReminderCleanupListener ─▶ reminder_settings 삭제
```

- **예약 범위**: 앱이 열릴 때마다 다시 예약하므로 "마지막 접속 = 지금"이다. 미접속 규칙 ④ 때문에 매일 알림(1·2·4·5·6번)은 **오늘과 내일만**, 그 뒤로는 7번(2·4·6일째)과 3번(8·14·30일째)만 예약한다 (R1.1, R6.5). 한 번에 최대 약 15개라 iOS의 대기 알림 한도(64개로 알려짐, 문서에서 확인 못 함) 안이다.
- **앞날의 값**: 내일 알림은 "오늘 더 읽지 않는다"고 보고 계산한다. 2번의 연속 일수는 오늘 안 읽었으면 방어권이 1개 이상일 때만 내일도 이어진다고 본다 (R5.7).
- **5번 주 1회**: 이미 울린 주에 다시 예약하지 않으려고, 5번을 예약한 날짜를 기기에 저장한다 (`expo-secure-store`, 키 `reminder.goalNearDate`). 그 날짜가 이번 주이고 이미 지났으면 이번 주에는 예약하지 않는다 (R6.3). 서버에는 저장하지 않는다.

## ② 바뀌는 것

| 구분 | 변경 | 관련 R |
|---|---|---|
| API | `GET /api/me/reminder-status` (새로 추가) — 아래 응답 | R4.1~R4.4 |
| API | `PUT /api/me/reminder-settings` (새로 추가) — 요청 `{ enabled, earlyLateMuted, weeklyGoalMinutes }`, 응답은 저장된 설정. `weeklyGoalMinutes`는 30~3000, 벗어나면 400 `VALIDATION_ERROR` | R4.5~R4.8 |
| DB | 테이블 `reminder_settings` 추가: `id`, `user_id`(UNIQUE `uk_reminder_settings_user_id`), `enabled`(NOT NULL DEFAULT true), `early_late_muted`(NOT NULL DEFAULT false), `weekly_goal_minutes`(NOT NULL DEFAULT 300), `created_at`, `updated_at` | R4.5, R4.6 |
| 비즈니스 규칙 | 알림 계획 규칙(알림 7종·겹침 규칙·해제 조건·경계 상황)은 앱의 `buildReminderPlan`에만 있다. 서버는 값만 준다 | R5~R8 |
| 비즈니스 규칙 | 알림용 조회의 날짜는 한국 시간, 독서는 **종료 시각** 기준 (다른 화면의 조회는 그대로) | R4.3 |
| 앱 | `expo-notifications` 추가 (`npx expo install expo-notifications`). 로컬 알림은 Expo Go에서도 동작한다 (SDK 57 문서) | R1 |

`GET /api/me/reminder-status` 응답:

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

- `today`·`weekStart`는 한국 시간 날짜, 주는 월요일 시작. `weekReadDates`는 이번 주 읽은 날 (4번 일요일 규칙 R6.4에 쓴다)
- `weekMinutes`·`todayMinutes`는 초를 모두 더한 뒤 분으로 내림 (R4.4)
- `currentStreak`·`ownedShieldCount`는 놓친 날을 방어권으로 처리한 **뒤** 값 (R4.2). 처리 기준일은 한국 시간 `today`
- 설정 행이 없으면 저장하지 않고 기본값(true, false, 300)을 돌려준다 (R4.6)

**서버 설계**

- 새 도메인 패키지 `com.chaekdami.reminder` (`presentation`·`application`·`domain`·`infrastructure`). 다른 도메인은 port로만 읽는다 (reward의 `WeeklyReadingTimeReader`와 같은 방식). 사용자는 `CurrentUser.requireId()`로 받는다 (`X-User-Id`를 쓰지 않음)
- 한국 시간 → DB 시각: DB의 시각은 서버 시간대의 로컬 시각이므로, 한국 날짜 경계를 서버 시간대로 바꿔 조회한다 (`RankingWeek.startAt(serverZone)`과 같은 방식). `reminder/domain/ReminderWeek`에 둔다
- 조회는 한 트랜잭션. 방어권 처리(`StreakService.settleBefore`)가 쓰기라 `readOnly`가 아니다. 보상 계정을 잠그는 처리는 기존 메서드를 그대로 쓴다
- 설정 저장은 `user_id`로 찾고 없으면 만든다. 동시에 처음 저장해 UNIQUE에 걸리면 한 번 다시 읽어 고친다
- 새 컬럼·테이블은 `ddl-auto=update`로 만들어진다. `@ColumnDefault`로 DB 기본값도 둔다 (스펙 012와 같음). PostgreSQL에서 실제로 만들어지는지는 병합 전에 사람이 확인한다

**앱 설계**

- `frontend/src/features/reminder/` (BE3 담당 공통 기능 폴더)
  - `buildReminderPlan.ts`: 순수 함수. `(status, now, goalNearDate) → [{ id, date, title, body? }]`. 알림 목록(R5), 겹침 규칙(R6), 해제 조건(R7), 지난 시각 건너뛰기·이른 아침/늦은 저녁 끄기(R8.1, R4.8)를 모두 여기서 처리
  - `reminderMessages.ts`: 문구·단계별 문구·제목 규칙(25자 이하면 문구를 제목으로)
  - `reminderScheduler.ts`: `rescheduleReminders()`, `cancelTodayEncouragements()`, `cancelAllReminders()`. 우리 알림만 identifier `reminder:<번호>:<날짜>`로 구분해 취소한다. 실행이 겹치면 진행 중인 것이 끝난 뒤 한 번만 더 실행 (R1.2, R1.3)
  - `reminderApi.ts`: 두 API
  - `ReminderSync.tsx`: `_layout.tsx`에 붙는 컴포넌트. 시작 때와 `AppState`가 `active`가 될 때 토큰이 있으면 다시 예약 (R2.3)
- 알림 표시: `setNotificationHandler`가 앱을 보는 중에는 `shouldShowBanner·shouldShowList: false`를 돌려준다 (R8.3)
- Android 채널: 이름 "독서 알림" 채널을 권한 요청 전에 만든다
- 권한: 첫 보상 처리 성공 뒤 권한이 "정하지 않음"이면 요청한다. 거절이면 예약하지 않는다 (R8.5). 안내 문구는 FE2 설정 화면
- 정확한 시각: Android 12+의 정확한 알람 권한(`SCHEDULE_EXACT_ALARM`)은 쓰지 않는다. 알림이 몇 분 늦을 수 있다 (알려진 한계, R8.6)
- 개발용 시험: `__DEV__`에서 `EXPO_PUBLIC_REMINDER_DAY_SECONDS`가 있으면 "하루"를 그 초로 줄여 예약한다 (R8.7)
- 세션 종료: `tokenStorage.clearTokens()` 안에서 `cancelAllReminders()`를 부른다. 로그아웃·탈퇴·재발급 실패·`home.tsx`의 처리가 모두 이 함수를 거친다 (R3.1, R3.2)

## ③ 수정할 파일

| 파일 | 변경 내용 |
|---|---|
| `backend/src/main/java/com/chaekdami/reminder/domain/ReminderSetting.java` | 새 파일. 설정 엔티티 (`reminder_settings`) |
| `backend/src/main/java/com/chaekdami/reminder/domain/ReminderWeek.java` | 새 파일. 한국 시간 날짜·주 경계, 서버 시각 변환 |
| `backend/src/main/java/com/chaekdami/reminder/infrastructure/ReminderSettingRepository.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/reminder/application/port/ReminderReadingReader.java` | 새 파일. 기간의 독서 초·읽은 날 |
| `backend/src/main/java/com/chaekdami/reminder/application/port/ReminderStreakReader.java` | 새 파일. 방어권 처리 뒤 연속 일수·방어권 수 |
| `backend/src/main/java/com/chaekdami/reminder/application/port/ReminderUserReader.java` | 새 파일. 닉네임 |
| `backend/src/main/java/com/chaekdami/reminder/infrastructure/ReadingSessionReminderReader.java` | 새 파일. `ReadingSession`을 종료 시각으로 집계 (BE1 코드는 고치지 않음) |
| `backend/src/main/java/com/chaekdami/reminder/infrastructure/StreakServiceReminderReader.java` | 새 파일. `StreakService`·방어권 수 조회 (BE2 코드는 고치지 않음) |
| `backend/src/main/java/com/chaekdami/reminder/infrastructure/UserRepositoryReminderReader.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/reminder/infrastructure/ReminderCleanupListener.java` | 새 파일. 탈퇴 때 설정 삭제 |
| `backend/src/main/java/com/chaekdami/reminder/application/ReminderStatusService.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/reminder/application/ReminderSettingService.java` | 새 파일. 조회(없으면 기본값)·저장·탈퇴 삭제 |
| `backend/src/main/java/com/chaekdami/reminder/application/result/ReminderStatusResult.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/reminder/application/result/ReminderSettingResult.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/reminder/presentation/ReminderController.java` | 새 파일. 두 API |
| `backend/src/main/java/com/chaekdami/reminder/presentation/dto/ReminderSettingRequest.java` | 새 파일. 검증 (30~3000) |
| `backend/src/test/java/com/chaekdami/reminder/` | 새 테스트: 주·날짜 경계(자정 넘김, 월요일), 방어권 처리 뒤 연속 일수, 기본값, 저장 검증, 탈퇴 삭제 |
| `backend/http/reminder.http` | 새 파일. 요청 예시 |
| `frontend/package.json` | `expo-notifications` 추가 (`npx expo install`) |
| `frontend/package-lock.json` | 위와 같음 |
| `frontend/app.json` | `expo-notifications` 플러그인 (아이콘·색은 기본값) |
| `frontend/src/features/reminder/` | 새 폴더. `buildReminderPlan.ts`, `reminderMessages.ts`, `reminderScheduler.ts`, `reminderApi.ts`, `ReminderSync.tsx`, `types.ts` |
| `frontend/src/app/_layout.tsx` | `ReminderSync`와 알림 표시 처리 붙이기 (스펙 008도 고침) |
| `frontend/src/utils/tokenStorage.ts` | `clearTokens()`에서 알림 모두 취소 |
| `frontend/src/features/fe2/screens/LoginScreen.tsx` | 로그인 성공 뒤 다시 예약 (FE2 파일) |
| `frontend/src/features/fe2/screens/SignupScreen.tsx` | 가입 성공 뒤 다시 예약 (FE2 파일) |
| `frontend/src/features/fe1/hooks/reading/useReadingEnd.ts` | 저장 성공 뒤 오늘 독려 알림 취소·다시 예약 (FE1 파일) |
| `frontend/src/features/fe1/screens/ReadingStartScreen.tsx` | 독서 시작 때 오늘의 1·2·4번 취소 (FE1 파일) |
| `frontend/src/features/fe2/hooks/useReadingComplete.ts` | 보상 처리 성공 뒤 다시 예약, 첫 권한 요청 (FE2 파일) |
| `frontend/src/features/fe2/screens/MyPageScreen.tsx` | "알림 설정" 항목을 설정 화면으로 연결 (FE2 담당) |
| `frontend/src/features/fe2/screens/NotificationSettingsScreen.tsx` | 새 파일. 설정 화면 (FE2 담당, BE3는 API·`reminderApi`만 제공) |
| `frontend/src/app/fe2/user/notification-settings.tsx` | 새 파일. 라우트 (FE2 담당) |
| `frontend/src/constants/routes.ts` | 설정 화면 경로 (FE2 담당) |

## ④ 고칠 docs 문서

- [ ] `docs/domains/reminder/overview.md`·`api.md`·`data.md`·`rules.md` — 새 도메인 (알림 계획 규칙은 rules에)
- [ ] `docs/architecture.md` — 도메인 목록·담당·의존 방향에 reminder 추가
- [ ] `docs/conventions/naming.md` — 패키지 도메인 목록에 reminder
- [ ] `AGENTS.md` — 작업별로 읽을 문서 표에 알림 행
- [ ] `docs/overview.md` — 기능 상태 (푸시 알림 → 로컬 독서 알림)
- [ ] `docs/glossary.md` — 알림 관련 용어 (미접속, 복귀 알림, 이른 아침·늦은 저녁)
- [ ] `docs/domains/user/overview.md` — 탈퇴 이벤트를 받는 도메인에 reminder
- [ ] `docs/domains/reward/api.md` — 해결된 ASK-9 표시 줄 정리 (부스터 만료 시각 시간대는 그대로라는 한 줄로)
- [ ] `docs/known-issues.md` — 병합 뒤 TODO-8·TODO-42 해결 처리, 진행 중 작업 표 행 삭제 (main에서)

## ⑤ 남은 질문 (❓)

requirements 4장의 가정 4개를 그대로 따른다 (이른 아침·늦은 저녁 = 4번·2번, 짧은 문구 = 25자 이하, 7·3번은 감정 제목, 미접속 규칙 ④ 유지). 그 밖에:

- 기기 시간대가 한국이 아니면? (가정: 기기 시각으로 예약한다. 서버의 `today`와 다를 수 있지만 한국 사용자만 본다)
- Android 정확한 알람 권한을 쓰지 않아 몇 분 늦을 수 있는데 괜찮은가? (가정: 괜찮다. 쓰려면 개발 빌드와 Play 정책 확인이 필요)
- FE2 설정 화면·라우트를 이 브랜치에서 FE2가 만드나, BE3가 기본 화면을 만들고 FE2가 꾸미나? (가정: 이 브랜치에는 BE3가 기본 화면까지 만든다. 마감이 내일이라)
- `getAllScheduledNotificationsAsync`(우리 알림만 고르기)는 SDK 57 문서 본문에서 확인하지 못했다. 없으면 예약한 identifier를 기기에 저장해 취소한다

---

## 변경 기록

| 날짜 | 바뀐 내용 | 이유 | 결정 |
|---|---|---|---|
| | | | |
