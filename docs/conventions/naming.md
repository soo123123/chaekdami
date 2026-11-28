> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# 이름 규칙

현재 코드에서 실제로 쓰고 있는 규칙만 적는다. 새 코드는 이 규칙을 따른다.

## 백엔드 (Java)

### 패키지

```
com.chaekdami.<도메인>.<계층>
도메인: reading · review · reward · dday · user · reminder   (공통: global, config)
계층:   presentation · application · domain · infrastructure
```

| 계층 | 들어가는 것 |
|---|---|
| `presentation` | Controller, Request/Response DTO(`presentation/dto`), 도메인 전용 예외 처리기 |
| `application` | 유스케이스 Service, 결과 객체(`result`), 입력 객체(`command`), 다른 도메인 접근 인터페이스(`port`), 이벤트(`event`) |
| `domain` | Entity, enum, 규칙 객체(`*Policy`, `*Calculator`), ErrorCode enum |
| `infrastructure` | Repository, 외부 API 클라이언트(`yes24`), port 구현, 이벤트 리스너, 초기 데이터(`*Seeder`) |

### 클래스

| 대상 | 규칙 | 예 |
|---|---|---|
| Controller | 리소스 + `Controller` | `BookController`, `ReadingSessionRewardController` |
| Service | 유스케이스·리소스 + `Service` | `ReadingSessionService`, `ShopService` |
| Request DTO | 동작 + 리소스 + `Request` (또는 리소스 + `Request`) | `CreateBookRequest`, `PurchaseRequest` |
| Response DTO | 리소스 + `Response` | `BookResponse`, `ReadingSessionRewardResponse` |
| 서비스 결과 | 리소스 + `Result` | `PurchaseResult`, `ReviewResult` |
| 서비스 입력 | 동작 + `Command` | `SignupCommand`, `ReviewWriteCommand` |
| Repository | Entity + `Repository` | `BookRepository` |
| 다른 도메인 조회 port | 대상 + `Reader` / `Checker` | `ReadingSessionReader`, `PhotoCertificationChecker` |
| port 구현 | 기술 + 인터페이스 이름 | `JdbcBookReader`, `ReadingSessionRepositoryReader` |
| 규칙 객체 | 개념 + `Policy` / `Calculator` / `Picker` | `ExperiencePolicy`, `StreakCalculator` |
| 에러 코드 | 도메인 + `ErrorCode` | `RewardErrorCode`, `ReviewErrorCode` |
| 이벤트 | 과거형 + `Event` | `UserWithdrawnEvent`, `SentenceCreatedEvent` |
| 리스너 | 목적 + `Listener` | `RewardCleanupListener` |

| 대상 | 규칙 | 예 |
|---|---|---|
| 메서드·변수 | camelCase, 메서드는 동사로 시작 | `completeReading()`, `currentPage` |
| 상수 | UPPER_SNAKE_CASE | `MAX_SECONDS` |
| enum 타입 / 값 | PascalCase / UPPER_SNAKE_CASE | `ReadingStatus.IN_PROGRESS` |

## 데이터베이스

| 대상 | 규칙 | 예 |
|---|---|---|
| 테이블 | snake_case 복수형 (`@Table(name=...)`로 명시) | `reading_records`, `user_quests` |
| 컬럼 | snake_case | `user_id`, `created_at` |
| PK | `id` | |
| FK | 참조 테이블 단수 + `_id` | `book_id`, `reading_record_id` |
| 시각 | `*_at` / 날짜 `*_date` | `completed_at`, `record_date` |
| UNIQUE | `uk_<테이블>_<컬럼들>` | `uk_books_user_id_item_id` |
| 인덱스 | `idx_<테이블>_<컬럼들>` | `idx_reward_transactions_user_id` |

## 프론트엔드 (TypeScript)

| 대상 | 규칙 | 예 |
|---|---|---|
| 화면 컴포넌트 | PascalCase + `Screen`, `features/<파트>/screens/` | `ReadingStartScreen.tsx` |
| 컴포넌트 | PascalCase 파일·이름 | `BookCard.tsx` |
| Hook | `use` + PascalCase | `useReadingTimer.ts` |
| API 모듈 | 도메인 + `Api` | `readingApi.ts`, `rewardApi.ts` |
| 라우트 파일 | kebab-case, `src/app/` 아래 | `book-search.tsx`, `reading-complete.tsx` |
| 라우트 상수 | 문자열 대신 `ROUTES`, 파라미터 이동은 `to*()` 함수 | `src/constants/routes.ts` |
| Props 타입 | 컴포넌트 + `Props` | `BookCardProps` |
| 이벤트 처리 / 콜백 Prop | `handle*` / `on*` | `handleStartReading`, `onPress` |
| Boolean | `is` · `has` · `can` | `isCompleted` |
| 상수 | UPPER_SNAKE_CASE | `MIN_READING_SECONDS` |
