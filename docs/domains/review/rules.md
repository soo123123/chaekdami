> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE3

# review 규칙

입력값 규칙 전체 표는 [api.md "입력 규칙"](./api.md#입력-규칙)에 있다. 여기서는 동작 규칙을 적는다.

## 1. 문장과 모음집

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 저장 시점 | 완독 전에도 가능. 회차 상태를 보지 않는다 | `SentenceService` | ✅ |
| 내용 | 앞뒤 공백 제거 후 1~500자 | `Sentence.MAX_CONTENT_LENGTH` | ✅ |
| 쪽 번호 | 선택. 1 이상, 책 전체 쪽수 이하 | `SentenceService` | ✅ |
| 소유권 | 남의 회차·문장은 404 | `OwnedResources` | ✅ |
| 모음집 공개 | **회차의 `isPublic`** (reading의 `PATCH /api/reading-records/{id}`로 변경). 기본 비공개 | `SentenceCollectionService` | ✅ |
| 내 모음집 | 읽는 중이어도 조회 가능. 남의 모음집은 커뮤니티로만 | `SentenceCollectionService` | ✅ |
| 세션 문장 | 세션 저장 요청의 `sentence`로 저장하는 메서드는 있으나 호출 안 됨 | `SentenceService.recordFromSession` | ⚠️ [ISSUE-BUG-2](../../known-issues.md#issue-bug-2) |

## 2. 리뷰(별점·한줄평)

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 단위 | 책당 1개 (`book_id` UNIQUE). 다회독해도 하나 | `Review` | ✅ |
| 작성 조건 | 그 책의 회차 중 완독이 있어야 함 (아니면 409 `READING_NOT_COMPLETED`) | `ReviewService` | ✅ |
| 중복 생성 | 409 `REVIEW_ALREADY_EXISTS` → 수정 API 사용 | `ReviewService` | ✅ |
| 별점 | 1~5 정수, 생성 시 필수 | `Review.MIN_RATING`·`MAX_RATING` | ✅ |
| 한줄평 | 최대 100자, 줄바꿈 불가. 빈 문자열을 보내면 한줄평 삭제 (별점은 남음) | `Review.MAX_ONE_LINE_LENGTH` | ✅ |
| 기본값 | `isSpoiler` false, `isPublic` true | `ReviewService` | ✅ |
| 리뷰 삭제 | API 없음 | — | ⏳ [TODO-9](../../known-issues.md#todo-9) |
| ISBN | 숫자·X만 남기고 대문자. reading의 ISBN 정규화와 같은 규칙이어야 함 | `ReviewService` ↔ `BookService` | ✅ |

## 3. 독후감

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 단위 | 회차당 1개 (`reading_record_id` UNIQUE) | `BookReport` | ✅ |
| 작성 조건 | 회차가 완독이어야 함 | `ReadingReviewService` | ✅ |
| 본문 | 1~2000자. 통합 저장에서 빈 문자열이면 삭제 | `BookReport.MAX_CONTENT_LENGTH` | ✅ |
| 공개 | 기본 비공개. 공개하면 커뮤니티에 노출 | `BookReport` | ✅ |
| 수정 이력 | 본문이 바뀔 때마다 `revision` +1 | `BookReport` | ✅ |
| AI 피드백 | — | — | ⏳ [TODO-4](../../known-issues.md#todo-4) |

### 독후활동 화면 통합 저장 (`PUT /api/reading-records/{id}/review`)

| 요청 | 동작 |
|---|---|
| `review` 있음 | 책의 리뷰를 만들거나 고침 |
| `bookReport` 키 없음 | 독후감 그대로 |
| `bookReport: null` 또는 본문 `""` | 독후감 삭제 |
| `bookReport.content: null` | 공개 여부만 변경 |

리뷰는 책 기준, 독후감은 회차 기준이라 응답도 둘로 나뉜다. 없는 쪽은 `null`.

## 4. 한줄평 목록·좋아요·신고

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 목록·통계 조회 조건 | 완독 여부 무관, ISBN만 있으면 됨 (검색한 사용자도 사용) | `ReviewSocialService` | ✅ |
| 목록에 보이는 것 | 공개 + 한줄평 있음 + 블라인드 아님 | `ReviewSocialService` | ✅ |
| 별점 통계 | 비공개 리뷰 별점도 익명 포함, 블라인드만 제외 | `ReviewSocialService.ratingSummary` | ✅ |
| 정렬 | `latest` · `likes` | `ReviewSocialService` | ✅ |
| 내 리뷰 좋아요·신고 | 400 `CANNOT_LIKE_OWN_REVIEW` · `CANNOT_REPORT_OWN_REVIEW` | `ReviewErrorCode` | ✅ |
| 좋아요 | PUT 추가 / DELETE 취소. 중복은 무시 | `ReviewLike` (on conflict do nothing) | ✅ |
| 신고 | 같은 사람 같은 리뷰 1번 (409 `ALREADY_REPORTED`). `OTHER`면 상세 필수(300자) | `ReviewReport` | ✅ |
| 자동 블라인드 | 신고 수가 기준 이상이면 블라인드 | `review.blind-threshold` (기본 3) | ✅ |
| 블라인드 해제 | 관리자만. 해제하면 신고 수 0으로, 신고 기록은 남김 | `ReviewAdminService` | ✅ |
| 동시성 | 좋아요 수·신고 수·블라인드는 원자적 UPDATE로만 변경 | `ReviewRepository` | ✅ |

## 5. 완독자 커뮤니티

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 진입 | 내 서재의 책(`bookId`)으로 들어가고, 그 책의 ISBN으로 다른 사용자의 책을 묶는다 | `CommunityService` | ✅ |
| 볼 수 있는 사람 | 그 ISBN을 완독한 사용자만. 아니면 항목 조회 403 `COMMUNITY_LOCKED` | `CommunityService` | ✅ |
| 요약 | 잠겨 있어도 200 (완독자 수를 보여 완독 동기 부여) | `CommunityService.summary` | ✅ |
| 항목 | 다른 사용자의 회차 중 공개 모음집 또는 공개 독후감 | `CommunityQueryRepository` | ✅ |
| 미리보기 문장 수 | 3개 | `CommunityService.PREVIEW_SENTENCE_COUNT` | ✅ |
| ISBN 없는 책 | 직접 입력해 ISBN이 없는 책은 커뮤니티·한줄평 대상 아님 | 프론트 `CommunityScreen` | ✅ |

## 6. 공통

| 규칙 | 값 | 코드 위치 |
|---|---|---|
| 목록 페이지 | `page` 0부터, `size` 1~50 (기본 20) | `Paging.MAX_SIZE` |
| 목록 응답 | `{ items, page, size, totalElements, hasNext }` | `global/dto/PageResponse` |
| 남의 리소스 | 403이 아니라 404 (존재 여부 숨김). 403은 커뮤니티 잠금·관리자에만 | `OwnedResources` |
| 페이지 번호 차이 | review 목록은 0부터, reading 도서 검색은 1부터 | ❓ [ASK-3](../../known-issues.md#ask-3) |
