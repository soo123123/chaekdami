> 기준: feature/014-reading-reminder (스펙 014) · 최종 확인: 2026-11-28 · 담당: BE3

# reminder — 독서 알림

책 읽기를 독려하는 **기기 로컬 알림**을 맞추는 도메인. 서버 푸시는 쓰지 않는다. 예약은 휴대폰 OS에 저장되므로 서버는 값과 설정만 주고, **예약·취소는 앱이 한다** ([스펙 014](../../specs/014-reading-reminder/)).

## 핵심 개념

| 개념 | 설명 | 자세히 |
|---|---|---|
| 알림 7종 | 저녁, 연속 독서, 복귀, 주말 아침, 주간 목표 임박, 주간 마무리, 미접속 | [rules.md](./rules.md#1-알림-목록) |
| 다시 예약 | 앱 시작·복귀, 로그인, 독서 저장, 보상 처리, 설정 저장 때 우리 알림을 모두 지우고 다시 예약 | [rules.md](./rules.md#3-다시-예약과-취소) |
| 마지막 접속 | 앱을 열 때마다 다시 예약하므로 "지금"이다. 매일 알림은 오늘·내일만, 그 뒤는 미접속·복귀 알림만 | [rules.md](./rules.md#2-겹침-규칙) |
| 알림 설정 | 전체 켜기, 이른 아침·늦은 저녁 끄기, 주간 목표. 행이 없으면 기본값 | [data.md](./data.md) |
| 날짜 기준 | 한국 날짜, 독서는 **종료 시각**, 주는 월요일 시작 (2026-11-28 결정) | [rules.md](./rules.md#4-날짜-기준) |

## 코드 위치

```
backend/src/main/java/com/chaekdami/reminder/
├── presentation/    ReminderController, dto/ReminderSettingRequest
├── application/     ReminderStatusService, ReminderSettingService, ReminderClock, port/, result/
├── domain/          ReminderSetting, ReminderWeek
└── infrastructure/  ReminderSettingRepository, ReminderSessionQueryRepository,
                     ReadingSessionReminderReader, StreakServiceReminderReader,
                     UserRepositoryReminderReader, ReminderCleanupListener
```

앱: `frontend/src/features/reminder/`

| 파일 | 하는 일 |
|---|---|
| `buildReminderPlan.ts` | 서버 값과 지금 시각으로 예약할 알림 목록을 만드는 순수 함수 (알림 규칙은 모두 여기) |
| `reminderMessages.ts` | 문구, 미접속·복귀 단계별 문구, 제목 규칙 |
| `reminderScheduler.ts` | 예약·취소, 겹친 실행 정리, 권한, Android 채널, 개발용 하루 줄이기 |
| `reminderApi.ts` | 두 API |
| `ReminderSync.tsx` | 루트 레이아웃에서 앱 시작·복귀 감지, 토큰 삭제 때 모두 취소, 앱을 보는 중에는 표시 안 함 |

설정 화면: `features/fe2/screens/NotificationSettingsScreen.tsx` (`/fe2/user/notification-settings`, 마이페이지 "알림 설정")

## 다른 도메인과의 연결

| 방향 | 무엇 | 방식 |
|---|---|---|
| reminder → reading | 이번 주 끝난 세션 (읽은 날, 독서 시간) | port `ReminderReadingReader` (읽기만) |
| reminder → reward | 놓친 날 방어권 처리 뒤 연속 일수, 방어권 수 | port `ReminderStreakReader` → `StreakService`, `UserItemRepository` |
| reminder → user | 닉네임 (알림 제목) | port `ReminderUserReader` |
| user → reminder | 회원 탈퇴 때 설정 삭제 | 이벤트 `UserWithdrawnEvent` → `ReminderCleanupListener` |
| 앱의 다른 화면 → 알림 모듈 | 다시 예약·취소 | `tokenStorage.clearTokens`(토큰 삭제 알림), `LoginScreen`·`SignupScreen`, `useReadingEnd`, `ReadingStartScreen`, `useReadingComplete` |

## 현재 상태

- ✅ 알림용 상태 조회, 설정 저장 API, 앱 예약·취소, 설정 화면 (스펙 014, 병합 전)
- Expo Go(Android)에서 확인 (2026-11-28). iOS·개발 빌드는 아직
- ⏳ [TODO-46](../../known-issues.md#todo-46) 여러 기기 동기화 · ⏳ [TODO-47](../../known-issues.md#todo-47) 단일 기기 로그인
