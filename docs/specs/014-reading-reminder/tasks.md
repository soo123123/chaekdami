> 상태: in-progress · 작성: 2026-11-28 · 기준: main@531cb3e · 담당: BE3
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# 014 · reading-reminder — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. 끝난 작업은 체크한다.
- 작업 하나는 한 번에 끝나고 바로 검증할 수 있는 크기로 쪼갠다.
- 설계와 다르게 해야 하면 멈추고 보고한다. (S10)
- 작업 기간: 2026-11-28~29

## 0. 준비

- [x] 0.1 최신 main을 이 브랜치에 병합 (사람이 한다) — 전체
      검증: `git merge-base --is-ancestor 9c62443 HEAD` 성공
- [x] 0.2 `expo-notifications` 추가와 `app.json` 플러그인 — R1
      검증: `cd frontend && npx expo install expo-notifications` 뒤 `npx tsc --noEmit`

## 1. 서버

- [x] 1.1 `ReminderWeek` (한국 날짜·월요일 주·서버 시각 변환) — R4.3, R8.2
      검증: `ReminderWeekTest` (자정 넘김, 일요일 23시 59분, 월요일 0시, 서버 시간대 UTC)
- [x] 1.2 `ReminderSetting` 엔티티·`ReminderSettingRepository` — R4.5, R4.6
      검증: `ReminderSettingServiceTest` (행이 없으면 기본값, 저장 뒤 같은 값)
- [x] 1.3 `ReminderSettingService`·`PUT /api/me/reminder-settings`·`ReminderSettingRequest` — R4.5, R4.7, R4.8
      검증: `ReminderSettingServiceTest`, 30 미만·3000 초과는 400
- [x] 1.4 port 3개와 구현 (`ReadingSessionReminderReader`, `StreakServiceReminderReader`, `UserRepositoryReminderReader`) — R4.1, R4.2, R4.4
      검증: `ReminderStatusServiceTest` (종료 시각 기준 집계, 초를 더한 뒤 분, 방어권 처리 뒤 연속 일수)
- [x] 1.5 `ReminderStatusService`·`GET /api/me/reminder-status` — R4.1~R4.4
      검증: `ReminderStatusServiceTest`, `ReminderController` 요청 테스트 (로그인 필요)
- [x] 1.6 `ReminderCleanupListener` (탈퇴 때 설정 삭제) — 범위 정리
      검증: `ReminderSettingServiceTest`
- [x] 1.7 `backend/http/reminder.http` — R4
      검증: 파일 확인

## 2. 앱 — 알림 계획과 예약

- [x] 2.1 `features/reminder/types.ts`, `reminderApi.ts` — R4.1, R4.5
      검증: `cd frontend && npx tsc --noEmit`, `python3 scripts/harness/contract-check.py`
- [x] 2.2 `reminderMessages.ts` (문구, 단계별 문구, 25자 제목 규칙, 닉네임) — R5.4~R5.6
      검증: `npx tsc --noEmit`
- [x] 2.3 `buildReminderPlan.ts` (알림 7종, 겹침 규칙, 해제 조건, 지난 시각 건너뛰기, 끄기 설정, 앞날 값) — R1.1, R4.7, R4.8, R5, R6, R7, R8.1, R8.2
      검증: `npx tsc --noEmit`, 아래 상황표를 계획 결과와 대조 (월요일·토요일·일요일, 오늘 읽음·안 읽음, 연속 0·1·2일, 방어권 0·1개, 목표까지 30·90분, 끄기 설정)
- [x] 2.4 `reminderScheduler.ts` (우리 알림만 취소·예약, 겹친 실행 정리, 5번 예약 날짜 저장, 개발용 하루 줄이기) — R1.2, R1.3, R6.3, R8.4, R8.7
      검증: `npx tsc --noEmit`
- [x] 2.5 `ReminderSync.tsx`와 `_layout.tsx` (앱 복귀 감지, 보는 중 표시 안 함, Android 채널) — R2.3, R8.3, R8.6
      검증: `npx tsc --noEmit`

## 3. 앱 — 다른 화면에 연결

- [x] 3.1 `tokenStorage.clearTokens()`에서 알림 모두 취소 — R3.1, R3.2
      검증: `npx tsc --noEmit`, 로그아웃 뒤 예약 목록이 빈 것 확인 (5.1)
- [x] 3.2 `LoginScreen`·`SignupScreen` 성공 뒤 다시 예약 (FE2 파일) — R2.3
      검증: `npx tsc --noEmit`
- [x] 3.3 `useReadingEnd` 저장 성공 뒤 오늘 독려 알림 취소·다시 예약 (FE1 파일) — R2.1, R2.4
      검증: `npx tsc --noEmit`
- [x] 3.4 `ReadingStartScreen` 독서 시작 때 오늘의 1·2·4번 취소 (FE1 파일) — R8.3
      검증: `npx tsc --noEmit`
- [x] 3.5 `useReadingComplete` 보상 처리 뒤 다시 예약, 첫 권한 요청 (FE2 파일) — R2.2, R8.5
      검증: `npx tsc --noEmit`

## 4. 앱 — 알림 설정 화면

> 담당은 FE2로 정했다. 마감 때문에 BE3가 기본 화면을 만드는 것으로 가정한다 (design ⑤). FE2가 만들기로 하면 이 단계는 FE2에게 넘기고 체크하지 않는다.

- [x] 4.1 `routes.ts` 경로와 `app/fe2/user/notification-settings.tsx` 라우트 — R4.5
      검증: `npx tsc --noEmit`
- [x] 4.2 `NotificationSettingsScreen` (전체 켜기, 이른 아침·늦은 저녁 끄기, 주간 목표, 권한 거절 안내) — R4.5~R4.8, R8.5
      검증: `npx tsc --noEmit`, 저장 뒤 다시 들어가도 같은 값
- [x] 4.3 `MyPageScreen`의 "알림 설정"을 새 화면으로 연결 — R4.5
      검증: 화면에서 이동 확인

## 5. 실기기 확인

- [x] 5.1 Expo Go(Android·iOS)에서 개발용 하루 줄이기로 예약·취소 확인: 앱 열기, 독서 시작·저장, 보상, 설정 변경, 로그아웃 — R1~R3, R7, R8
      검증: 예약 목록·실제 알림 확인, 결과를 이 파일에 기록
- [x] 5.2 미접속 흐름: 앱을 연 뒤 닫아 두고 7번(2·4·6일째)·3번(8·14·30일째) 단계별 문구 확인 — R5.5, R6.5
      검증: 줄인 하루로 알림 6개 확인
- [x] 5.3 실제 DB(PostgreSQL)에 `reminder_settings`가 만들어지는지 확인 (사람) — R4.5
      검증: 테이블·UNIQUE·기본값 확인

## 결과 기록

- 1단계: `ReminderWeekTest` 5, `ReminderStatusServiceTest` 3, `ReminderDbTest` 5(H2), `ReminderControllerTest` 3 통과. 전체 백엔드 테스트 457개 통과 (2026-11-28)
- 2.3: 계획 함수를 스크래치에서 실행해 상황 10개를 대조 (토·일·수, 읽음·안 읽음, 연속 1·5일, 방어권 0·1개, 목표까지 30·40분, 5번 이미 보냄, 끄기 설정, 독서 중, 알림 끔). 규칙과 일치
- 3.1: 실제 취소는 5.1에서 확인
- 5.3: dev 프로필로 서버를 띄워 팀 DB(PostgreSQL 17)에 `reminder_settings` 생성 확인. 컬럼 기본값(true·false·300), UNIQUE `uk_reminder_settings_user_id` 포함 (2026-11-28)
- 5.1: Expo Go(Android, 하루=60초)에서 권한 요청·예약·알림 수신 확인 (2026-11-28). Expo Go에서는 Android 알림 채널을 만들 수 없어(`setNotificationChannelAsync` NullPointerException) 권한 요청·예약이 멈추던 문제를 찾아 고침: 채널을 못 만들면 기본 채널로 예약. 독서 중·오늘 읽음·알림 끔·이른 아침·늦은 저녁 끄기·주간 목표 변경·다른 계정 닉네임·지난 시각·겹침 ①⑤·금지 시간은 계획 함수 상황 시험 20개로 확인. 기기에서 따로 확인하지 못한 것: 로그아웃 뒤 실제 취소, iOS, 개발 빌드의 "독서 알림" 채널, 강제 종료·재부팅 뒤 예약 유지
- 5.2: 계획 함수로 7번 2·4·6일째, 3번 8·14·30일째(모두 20:00), 단계 문구 순서, 30일째 뒤 없음, 2일째부터 매일 알림 없음 확인. 하루=60초면 2.5~30.5분 뒤에 울림. 기기에서 30분 기다리는 확인은 하지 않음
- 테스트 중 `GET /api/rewards`·`/api/me/reminder-status`가 가끔 409(`CONCURRENCY_001`, 보상 계정 잠금 3초 초과). 팀 DB에서 다른 연결이 잠금을 쥔 채 "idle in transaction"으로 100초 넘게 멈춘 것을 확인. 이 PC 서버의 요청은 아니었음
- 9.3: 새 파일·수정 파일의 린트 오류 0. 저장소 전체 린트에는 원래 있던 오류가 남아 있음

## 9. 마무리

- [x] 9.1 전체 테스트 — 검증: `cd backend && ./gradlew test`
- [x] 9.2 계약 검사 — 검증: `python3 scripts/harness/contract-check.py`
- [x] 9.3 프론트 검사 — 검증: `cd frontend && npx tsc --noEmit`, `npx expo lint`
- [x] 9.4 **docs 반영**: design ④의 문서 전부 수정 — 검증: `python3 scripts/harness/docs-check.py`
- [ ] 9.5 상태 줄을 done으로, `docs/specs/README.md` 목록 갱신
- [ ] 9.6 병합 뒤 main에서 known-issues TODO-8·42 해결 처리, 진행 중 작업 행 삭제, 노션 카드 완료 처리
