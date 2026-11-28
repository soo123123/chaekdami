> 기준: feature/003-session-sentence (스펙 003) · 최종 확인: 2026-11-22 · 담당: BE1

# reading — 독서

도서를 검색해 **개인 서재**에 담고, 회차별 **독서 기록**과 타이머 **세션**으로 읽은 시간·페이지를 쌓는 도메인.

## 핵심 개념

| 개념 | 설명 | 자세히 |
|---|---|---|
| 도서 검색 | 서버가 YES24 Open API를 호출. 검색(가벼운 목록) → 상세(쪽수·소개) 2단계 | [api.md](./api.md#도서-검색) |
| 개인 서재 (book) | 사용자별로 따로 저장되는 책. 같은 책도 사용자마다 `bookId`가 다름 | [data.md](./data.md#books) |
| 독서 기록 (reading record) | 책 한 권을 **한 번** 읽는 회차. 다회독이면 회차마다 1건 | [rules.md](./rules.md#2-독서-기록회차) |
| 독서 세션 (reading session) | 타이머 한 번의 독서. 시간·시작/끝 페이지 | [rules.md](./rules.md#3-독서-세션) |
| 독서율 | 현재 페이지 ÷ 전체 쪽수 × 100. 저장하지 않고 계산 | [rules.md](./rules.md#2-독서-기록회차) |
| 독서 인증 (certification) | 책 페이지 사진을 AI가 읽고 통과·확인 불가·실패로 판정. 회차에 쌓인다 | [rules.md](./rules.md#5-독서-인증) |
| 오늘·통계 | 홈의 오늘 독서, 통계 화면의 주·월·하루 시간 | [api.md](./api.md#오늘통계) |

식별자(`itemId` · `bookId` · `readingRecordId` · `readingSessionId`) 구분은 [glossary.md](../../glossary.md)

## 코드 위치

```
backend/src/main/java/com/chaekdami/reading/
├── presentation/    BookController, ReadingRecordController, ReadingSessionController,
│                    TodayReadingController, CertificationController, ReadingExceptionHandler,
│                    dto/{request,response}
├── application/     BookSearchService, BookService, ReadingRecordService, ReadingSessionService,
│                    TodayReadingService, ReadingStatsService, CertificationService, CertificationVerifier
├── domain/          Book, ReadingRecord, ReadingSession, ReadingStatus, Certification, CertificationStatus
└── infrastructure/  BookRepository, ReadingRecordRepository, ReadingSessionRepository,
                     CertificationRepository, yes24/Yes24Client,
                     ai/{PageTextExtractor, GeminiPageTextExtractor, MockPageTextExtractor}
```

프론트 (FE1): `frontend/src/features/fe1/` — `api/readingApi.ts`, 화면 `BookSearch` · `BookInfo` · `BookRegister` · `ManualRegister` · `Library` · `LibraryCustomize` · `BookDetail` · `ReadingStart` · `ReadingEnd`
프론트 (FE2): `features/fe2/api/todayReadingApi.ts`, `readingStatsApi.ts` — 홈·통계 화면

## 다른 도메인과의 연결

| 방향 | 무엇 | 방식 |
|---|---|---|
| review → reading | 책·독서 기록 조회 (완독 여부, ISBN 등) | port `BookReader`, `ReadingRecordReader` (JDBC) |
| reward → reading | 세션 조회 (보상 계산) | port `ReadingSessionReader` |
| reading → review | 오늘 저장한 문장 수 | 직접 참조 `SentenceRepository` (`TodayReadingService`) |
| reading → review | 세션 저장 때 문장 저장 | port `SessionSentenceRecorder` → `SentenceServiceSessionSentenceRecorder` |
| reading → review | 책 삭제 때 독후활동 삭제 | port `BookActivityCleaner` → `ReviewBookActivityCleaner` |
| user → reading | 회원 탈퇴 때 서재 삭제 | 이벤트 `UserWithdrawnEvent` → `ReadingCleanupListener` |
| 앱 | 세션 저장 응답의 `id`로 독서 완료 보상 요청 | [architecture.md](../../architecture.md#41-독서--보상) |

## 프론트 화면 흐름 (FE1)

```
서재 ─책 추가─▶ 검색 ─책 선택─▶ 책 정보 ─등록─▶ 등록(목표 설정) ─▶ 서재
                 └─직접 등록─▶ 직접 등록 ─▶ 서재
서재 ─책 선택─▶ 책 상세 ─독서 시작─▶ 독서(타이머) ─종료─▶ 독서 종료(시간·페이지·사진·문장) ─저장─▶ 독서 완료(FE2)
서재 ─꾸미기─▶ 서재 꾸미기 (테마는 기기에 계정별로 저장)
서재 ─(저장하지 못한 독서 기록이 있으면)─▶ 이어서 하기: 독서 시작(일시정지) 또는 독서 종료
```

| 화면 | 라우트 | 파라미터 |
|---|---|---|
| 검색 | `/fe1/book-search` | — |
| 책 정보 · 등록 | `/fe1/book-info` · `/fe1/book-register` | `itemId` |
| 직접 등록 | `/fe1/manual-register` | — |
| 서재 · 꾸미기 | `/fe1/library` · `/fe1/library-customize` | — |
| 책 상세 · 독서 시작 | `/fe1/book-detail` · `/fe1/reading-start` | `bookId` |
| 독서 종료 | `/fe1/reading-end` | `bookId`, `elapsedTime`(초) |

- `itemId`(YES24)와 `bookId`(내 서재)는 프론트 타입부터 분리돼 있다 (`features/fe1/types/reading.ts`).
- 하단 탭바는 서재·커뮤니티 화면 맨 아래에 직접 붙인다. 레이아웃에 두면 화면 전환 때 서재 높이가 흔들리기 때문이다.
- 직접 등록 화면의 표지 사진은 "준비 중"으로 막아 두었다. 서버에 이미지 업로드가 없어 골라도 저장되지 않는다 (ISSUE-BUG-21).
- 책 정보 화면에는 찜하기가 없다 (ASK-12).
- 검색 결과에서 이미 서재에 있는 책(itemId, 없으면 ISBN이 같은 책)은 "내 서재에 있는 책"으로 표시하고, 등록 버튼 대신 책 상세를 연다.
- 책 등록 뒤 설정 저장(PATCH)은 실패하면 한 번 더 보낸다. 그래도 실패하면 저장하지 못한 값(현재 쪽·목표·공개)을 알려 준다 (ISSUE-BUG-20).
- 기기 저장값(테마·읽던 독서 기록)은 Access Token의 사용자 번호로 계정을 나눈다 (`utils/currentUser.ts`).

## 현재 상태

- ✅ 검색, 서재(등록·목록·상세·삭제·상태 필터), 독서 기록(회차·페이지·목표·메모·완독·다회독), 세션 저장·목록, 오늘·통계, 독서 인증(서버)
- ✅ 세션과 문장을 한 번에 저장, 책 삭제·탈퇴 시 관련 데이터 정리 (스펙 003)
- ⚠️ [ISSUE-BUG-3](../../known-issues.md#issue-bug-3) 응답만 끊긴 뒤 다시 저장하면 세션 중복
- ⏳ [TODO-23](../../known-issues.md#todo-23) 독서 인증 429 임시 규칙 (통과, 보상 제외)
- ⏳ [TODO-24](../../known-issues.md#todo-24) AI 장애를 앱에 따로 알리지 않음
- ⏳ [TODO-2](../../known-issues.md#todo-2) 세션 요청의 `photos` 저장 안 함
- ⏳ [TODO-7](../../known-issues.md#todo-7) 서재 테마 저장 API 없음 (기기에 계정별로 저장)
- ⏳ [TODO-11](../../known-issues.md#todo-11) 바코드 스캔 검색 미구현
- ⏳ [TODO-27](../../known-issues.md#todo-27) LLM 책 추천 (검색 화면) 미구현
