> 기준: feature/003-session-sentence (스펙 003) · 최종 확인: 2026-11-22 · 담당: BE1

# reading 규칙

## 1. 도서 검색과 서재

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| YES24 호출 | 서버만 호출 (키 노출·CORS 방지). 키는 `YES24_API_KEY` | `Yes24Client` | ✅ |
| 검색과 상세 분리 | 검색 `detail=N`(가벼운 목록), 상세 `detail=Y`(쪽수·소개) | `Yes24Client` | ✅ |
| 세트 상품 | ISBN이 없는 상품은 검색 결과에서 제외 | `BookSearchService` | ✅ |
| YES24 404 | 에러가 아니라 "결과 없음" (검색) / 404 (상세) | `Yes24Client` | ✅ |
| 출간일 변환 | `"20190226"` → `"2019-02-26"` | `BookSearchService` | ✅ |
| 검색 페이지 크기 | 1~50 | `BookSearchService.MAX_PAGE_SIZE` | ✅ |
| 등록 필수값 | 제목 비어 있지 않음, 전체 쪽수 1 이상 | `BookService.createBook` | ✅ |
| ISBN 정규화 | 숫자·X 외 문자 제거, 빈 값은 `null` | `BookService` | ✅ |
| 중복 등록 | 같은 사용자가 같은 YES24 책(`item_id`)을 두 번 → 409. 직접 입력 책은 제한 없음 | `BookService`, UNIQUE `uk_books_user_id_item_id` | ✅ |
| 등록 시 1회차 | 책을 담는 순간 1회차 기록을 `NOT_STARTED`·0쪽으로 생성 | `BookService.createBook` | ✅ |
| 소유권 | 서재 조회·삭제는 `user_id`와 `book_id`를 함께 조건. 남의 책은 404 | `BookService.findMyBook` | ✅ |
| 서재 상태 필터 | 책별 **최근 회차**의 상태로 거른다 | `BookService.getBooks` | ✅ |

## 2. 독서 기록(회차)

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 상태 전환 | `NOT_STARTED` → (0쪽 초과) `IN_PROGRESS` → (마지막 쪽) `COMPLETED` | `ReadingRecord.updatePage` | ✅ |
| 페이지 범위 | 0 이상, 전체 쪽수 이하 | `ReadingRecord.updatePage` | ✅ |
| 자동 완독 | 현재 페이지 = 전체 쪽수가 되면 완독 (PATCH·세션 모두) | `ReadingRecord` | ✅ |
| 완독 후 수정 | 페이지 수정·세션 추가 불가 (400·409). 새 회차를 시작해야 함 | `ReadingRecord` | ✅ |
| 진행 중 회차 수 | 한 책에 끝나지 않은 회차는 최대 1개. 새 회차는 최근 회차가 완독일 때만 (아니면 409) | `ReadingRecordService.create` | ✅ |
| 독서율 | `current_page ÷ total_pages × 100`, 저장하지 않음 | `ReadingRecord.getProgressRate` | ✅ |
| 메모 길이 | 200자 이하 | `ReadingRecord.MAX_MEMO_LENGTH` | ✅ |
| 하루 목표 페이지 | 1 이상 | `ReadingRecord.changeGoal` | ✅ |
| 공개 여부 | 이 회차의 문장 모음집을 커뮤니티에 공개할지. 기본 비공개 | `ReadingRecord` → `SentenceCollectionService` | ✅ |
| 완독 → 보상 | 완독 API는 보상을 주지 않음 | `ReadingRecordService.complete` | ✅ (보상은 세션 단위) |

## 3. 독서 세션

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 최소 시간 | 3분 (프론트 종료 버튼도 3분 전에는 잠김) | `ReadingSession.MIN_SECONDS` ↔ 프론트 `MIN_READING_SECONDS` | ✅ |
| 최대 시간 | 2시간 | `ReadingSession.MAX_SECONDS` | ✅ ❓ [ASK-2](../../known-issues.md#ask-2) |
| 페이지 | 시작 0 이상, 끝 ≥ 시작, 끝 ≤ 전체 쪽수 | `ReadingSession.of` | ✅ |
| 시각 | 앱 값을 믿지 않고 서버 시각 기준. `ended_at` = 요청 받은 시각 | `ReadingSessionService.create` | ✅ |
| 붙을 회차 | 최근 회차가 진행 중이면 그 회차, 기록이 없으면 1회차 생성, 최근 회차가 완독이면 409 | `ReadingSessionService` | ✅ |
| 현재 페이지 갱신 | 끝 페이지가 현재 페이지보다 크면 갱신. **뒤로 가지 않음** (앞부분 재독은 저장되지만 현재 페이지 유지) | `ReadingRecord.applySession` | ✅ |
| 상태 갱신 | 읽기 전이면 읽는 중으로, 끝 페이지가 마지막 쪽이면 완독 | `ReadingRecord.applySession` | ✅ |
| 보상 | 세션 저장은 보상을 주지 않는다. 독서 완료 화면이 보상 API를 부른다 | [reward/rules.md](../reward/rules.md#1-독서-완료-보상) | ✅ |
| 문장 | 요청의 `sentence`를 이 회차 문장으로 저장 (쪽 번호 = `endPage`). 빈 문장은 저장 안 함, 규칙 위반(500자 초과)이면 세션까지 취소 | `ReadingSessionService.create` → port `SessionSentenceRecorder` → `SentenceService.recordFromSession` | ✅ |
| 한 트랜잭션 | 세션·인증 연결·문장을 함께 저장, 하나라도 실패하면 전부 취소 | `ReadingSessionService.create` | ✅ ⚠️ [ISSUE-BUG-3](../../known-issues.md#issue-bug-3) |
| 사진 | `photos`는 받기만 하고 저장하지 않음 | `ReadingSessionService` | ⏳ [TODO-2](../../known-issues.md#todo-2) |
| 시간 입력 | 앱이 보낸 `readingTime`을 범위만 검증 | `ReadingSession.of` | ⚠️ [ISSUE-LIMIT-1](../../known-issues.md#issue-limit-1) |
| 앱 종료 시 | 타이머 중 앱이 완전히 종료되면 측정 시간 유실 | 앱 `useReadingTimer` | ⚠️ [ISSUE-LIMIT-2](../../known-issues.md#issue-limit-2) |
| "상태 변경 5분" | 옛 기획의 문구, 의미 미정 | — | ❓ [ASK-1](../../known-issues.md#ask-1) |

## 4. 오늘·통계

| 규칙 | 값 | 코드 위치 |
|---|---|---|
| 오늘 독서 분 | 오늘 세션 시간 합, 30초 단위 반올림 | `TodayReadingService` |
| 통계 날짜 기준 | 세션 `started_at`의 날짜 | `ReadingStatsService` |
| 주간 | 이번 주 월~일 | `ReadingStatsService.week` |
| 월간 | 이번 달을 7일씩 1~3주, 4주는 22일~말일 | `ReadingStatsService.month` |
| 하루 | 오늘을 05·08·11·14·17·20시 시작 6구간 (라벨 06시~21시) | `ReadingStatsService.DAILY_START_HOURS` |
| 목표 달성 | `goalBooks`·`goalTarget` 항상 0 | ⏳ [TODO-12](../../known-issues.md#todo-12) |

## 5. 독서 인증

판정: 실패 사유가 하나라도 있으면 `FAILED`, 없고 확인 불가 사유가 있으면 `UNVERIFIED`, 둘 다 없으면 `PASSED`. 억울한 실패를 줄이려고 느슨하게 판정한다.

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 실패: 책 페이지 아님 | AI가 "책 페이지가 아니다"라고 **확실히** 판단한 경우만 (판단 못 하면 통과) | `CertificationVerifier.verify` | ✅ |
| 실패: 같은 사진 재사용 | 내 최근 인증 50건과 글자 3글자 조각이 90% 이상 겹치면 | `CertificationVerifier.DUPLICATE_SIMILARITY`, `CertificationService` | ✅ |
| 확인 불가: 글자 부족 | 읽은 글자(정규화 후)가 20자 미만 | `CertificationVerifier.MIN_TEXT_LENGTH` | ✅ |
| 확인 불가: 쪽 번호 범위 밖 | 읽은 범위 ±3쪽 밖. `startPage`·`endPage`를 둘 다 보냈을 때만 비교, 쪽 번호를 못 찾으면 통과. **앱은 범위를 보내지 않으므로** 앱 인증에서는 비교하지 않는다 | `CertificationVerifier.PAGE_MARGIN` | ✅ |
| 문장 확인 | 문장의 3글자 조각 60% 이상이 사진에 있으면 찾은 것. 판정에는 영향 없음 | `CertificationVerifier.SENTENCE_MATCH` | ✅ |
| AI 선택 | `OCR_PROVIDER=gemini` + `GEMINI_API_KEY`면 Gemini, 아니면 Mock (항상 책 페이지, 쪽 번호 없음) | `GeminiPageTextExtractor`, `MockPageTextExtractor` | ✅ |
| AI 다시 시도 | 연결 실패·서버 오류(5xx)면 첫 호출 시작부터 4초 안에 실패했을 때만 1초 쉬고 한 번 더 (최대 2번, 전체 약 40초) | `GeminiRetryPolicy`, `GeminiPageTextExtractor.extract` | ✅ |
| AI 장애 | 응답 시간 초과(30초)·그 밖의 실패, 다시 시도해도 실패하면 빈 결과로 처리 → 글자 부족으로 `UNVERIFIED` (앱은 다시 찍게 안내) | `GeminiPageTextExtractor.extract` | ✅ ⏳ [TODO-24](../../known-issues.md#todo-24) |
| AI 사용 한도 초과(429) | 다시 시도 없이 다른 검사도 건너뛰고 `PASSED` + "AI 확인 없이 통과" 문구, `ai_skipped = true`. Gemini가 임시 API라 둔 **임시 규칙** | `GeminiRetryPolicy`, `CertificationVerifier.verify` | ✅ ⏳ [TODO-23](../../known-issues.md#todo-23) |
| 사진 크기 | 최대 10MB. AI에 보내기 전 긴 쪽 1600px로 줄임 (HEIC는 원본) | `application.properties`, `GeminiPageTextExtractor.MAX_SIDE` | ✅ |
| 사진 저장 | 저장하지 않음 (`image_url` 항상 `null`) | `CertificationService` | ✅ |
| 소유권 | 남의 회차면 404 | `CertificationService` | ✅ |
| AI 대기 중 트랜잭션 | AI는 트랜잭션 밖에서 부르고, 저장할 때 회차를 다시 확인 (그사이 지워졌으면 404) | `CertificationService.certify` | ✅ |
| 세션 연결 | 세션 저장 때 `photoVerificationId`가 내 인증 + `PASSED` + 아직 안 쓰임이면 그 세션에 연결 (회차는 비교·이동하지 않음). 안 맞으면 무시하고 저장은 성공. 인증 하나는 세션 하나에만 | `ReadingSessionService.linkCertification`, `Certification.linkSession` | ✅ |
| 보상 연결 | 세션에 연결된 인증이 `PASSED`이고 `ai_skipped`가 아니면 사진 인증 보상 대상 ([reward/rules](../reward/rules.md#2-경험치)) | `CertificationService.isPhotoCertified`, `CertificationPhotoChecker` | ✅ |
| 앱 연결 | 사진을 붙일 때 가장 최근 회차로 `image`만 보냄. `PASSED`만 통과, `UNVERIFIED`·`FAILED`는 사진을 지우고 다시 찍게 함. 45초 기다림 | 앱 `photoVerifyApi.ts`, `useReadingEnd.ts`, `config.ts` | ✅ |
