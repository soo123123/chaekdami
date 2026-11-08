# 독후활동 API (프론트엔드용)

문장 기록, 문장 모음집, 별점과 한줄평 리뷰, 독후감, 완독자 커뮤니티, 좋아요와 신고 API다. 요청 예시는 [`backend/http/review.http`](../backend/http/review.http)에 있다.

## 공통

- 모든 API는 로그인이 필요하다. `Authorization: Bearer {accessToken}`을 보낸다. 토큰이 없으면 401이다.
- 성공 응답은 래퍼 없이 DTO를 그대로 준다.
- 날짜는 `"2026-11-09"`, 시각은 `"2026-11-09T01:58:43.801149"`(한국 시간, 시간대 표기 없음)다.
- 다른 사용자의 회차, 책, 문장, 리뷰, 독후감에 접근하면 403이 아니라 404다. 403은 커뮤니티 잠금과 관리자 API에만 쓴다.
- ID 용어: `bookId`는 내 서재의 책, `readingRecordId`는 그 책의 회차(1회독, 2회독)다. 독서 세션 ID는 이 API들에 넣지 않는다.

### 오류 형식

```json
{
  "code": "VALIDATION_ERROR",
  "message": "요청 값이 올바르지 않습니다.",
  "fields": [{ "field": "pageNumber", "message": "쪽 번호는 1 이상 300 이하여야 합니다." }]
}
```

`fields`는 입력값 오류일 때만 들어 있는 배열이다.

| HTTP | code | 상황 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | 입력값 오류, 숫자가 아닌 경로 값, 필수 쿼리 누락 |
| 400 | `CANNOT_LIKE_OWN_REVIEW` | 내 리뷰에 좋아요 |
| 400 | `CANNOT_REPORT_OWN_REVIEW` | 내 리뷰 신고 |
| 401 | (인증 오류) | 토큰 없음, 만료 |
| 403 | `COMMUNITY_LOCKED` | 완독하지 않은 책의 커뮤니티 항목 조회 |
| 403 | (권한 오류) | 일반 사용자의 관리자 API 호출 |
| 404 | `READING_RECORD_NOT_FOUND` | 회차가 없거나 내 회차가 아님 |
| 404 | `BOOK_NOT_FOUND` | 책이 없거나 내 책이 아님 |
| 404 | `SENTENCE_NOT_FOUND` | 문장이 없거나 내 문장이 아님 |
| 404 | `REVIEW_NOT_FOUND` | 리뷰가 없음. 좋아요·신고에서는 비공개·블라인드·한줄평 없는 리뷰도 404 |
| 404 | `BOOK_REPORT_NOT_FOUND` | 독후감이 없거나 내 독후감이 아님 |
| 404 | `COMMUNITY_ENTRY_NOT_FOUND` | 커뮤니티에 공개되지 않은 회차 |
| 409 | `READING_NOT_COMPLETED` | 완독 전 리뷰 작성, 완독 전 회차 독후활동 저장 |
| 409 | `REVIEW_ALREADY_EXISTS` | 같은 책에 리뷰를 다시 생성 |
| 409 | `BOOK_REPORT_ALREADY_EXISTS` | 같은 회차에 독후감을 동시에 생성 |
| 409 | `ALREADY_REPORTED` | 같은 리뷰를 다시 신고 |

### 페이지 응답

목록 API는 `page`(0부터), `size`(1~50, 기본 20)를 받고 아래 형식으로 준다.

```json
{ "items": [], "page": 0, "size": 20, "totalElements": 35, "hasNext": true }
```

## 1. 문장 기록 (FE1)

독서 종료 화면에서 BE1 세션 저장(`POST /api/reading-records/{id}/sessions`)이 성공한 뒤 따로 호출한다. 회차 상태와 관계없이 내 회차면 저장된다. 완독 처리 뒤에 마지막 날 문장을 올려도 된다.

### `POST /api/reading-records/{readingRecordId}/sentences` → 201

```json
{ "content": "우리는 모두 각자의 속도로 자란다.", "pageNumber": 42 }
```

- `content`: 필수. 앞뒤 공백을 지운 뒤 1~500자.
- `pageNumber`: 선택. 1 이상, 책의 전체 쪽수 이하.
- `readDate`는 서버가 저장 시점의 한국 날짜로 정한다.

응답 `SentenceResponse`:

```json
{
  "sentenceId": 1, "readingRecordId": 1, "bookId": 1, "readDate": "2026-11-09",
  "pageNumber": 42, "content": "우리는 모두 각자의 속도로 자란다.",
  "createdAt": "2026-11-09T01:58:43.78", "updatedAt": "2026-11-09T01:58:43.78"
}
```

### `GET /api/reading-records/{readingRecordId}/sentences` → 200 `SentenceResponse[]`

최신순 평면 목록이다. 독서 완료 화면의 "오늘의 한 줄 정리"는 `readDate`가 오늘인 첫 항목이다.

### `PATCH /api/sentences/{sentenceId}` → 200 `SentenceResponse`

보낸 필드만 바뀐다. `"pageNumber": null`을 보내면 쪽 번호가 지워지고, 키를 빼면 그대로다. `readDate`는 바뀌지 않는다.

### `DELETE /api/sentences/{sentenceId}` → 204

## 2. 문장 모음집 (FE1)

### `GET /api/reading-records/{readingRecordId}/sentence-collection` → 200

읽는 중인 회차도 200이다. 날짜 오름차순으로 묶고, 하루 안에서는 쪽 번호순(쪽 번호 없는 문장은 뒤, 그다음 작성순)이다.

```json
{
  "readingRecordId": 1, "round": 1, "status": "COMPLETED",
  "book": { "bookId": 1, "title": "Book A", "author": "Author", "coverUrl": null, "totalPages": 300 },
  "startedAt": "2026-10-01T20:00:00", "completedAt": "2026-10-20T22:00:00",
  "isPublic": false,
  "readingPeriodDays": 40, "recordedDayCount": 1, "sentenceCount": 3,
  "days": [
    {
      "readDate": "2026-11-09", "dayNumber": 40,
      "sentences": [
        { "sentenceId": 2, "content": "첫 페이지의 한국어 문장", "pageNumber": 10, "createdAt": "...", "updatedAt": "..." },
        { "sentenceId": 3, "content": "no page sentence", "pageNumber": null, "createdAt": "...", "updatedAt": "..." }
      ]
    }
  ]
}
```

- `dayNumber`: 회차 시작일을 1일차로 센 n일차.
- `readingPeriodDays`: 시작일부터 완독일(읽는 중이면 오늘)까지 일수. 완독 뒤에 문장을 더 남기면 마지막 기록일까지 늘어난다.
- `recordedDayCount`: 문장을 남긴 날 수.
- `isPublic`: 커뮤니티 공개 여부. 기본은 비공개다.

### `PUT /api/reading-records/{readingRecordId}/sentence-collection/visibility` → 200

```json
{ "isPublic": true }
```

응답: `{ "readingRecordId": 1, "isPublic": true }`. 독후감 공개와는 따로 동작한다.

### `GET /api/me/sentence-collections?bookId=&page=0&size=20` → 200 페이지

문장이 있는 내 회차를 마지막 기록일 최신순으로 준다. 읽는 중인 회차도 포함한다. `bookId`를 주면 그 책의 회차만 준다.

```json
{
  "items": [{
    "readingRecordId": 1, "round": 1, "status": "COMPLETED",
    "book": { "bookId": 1, "title": "Book A", "author": "Author", "coverUrl": null },
    "completedAt": "2026-10-20T22:00:00", "sentenceCount": 3,
    "lastReadDate": "2026-11-09", "previewSentence": "첫 페이지의 한국어 문장"
  }],
  "page": 0, "size": 20, "totalElements": 1, "hasNext": false
}
```

## 3. 리뷰(별점과 한줄평)와 독후감 (FE2)

리뷰는 책당 1개, 독후감은 회차당 1개다. 리뷰는 그 책에 완독 회차가 하나라도 있어야 쓸 수 있다.

### 독후활동 화면 통합 API

#### `GET /api/reading-records/{readingRecordId}/review` → 200

항상 같은 형식이다. 없는 쪽은 null이고, null이면 빈 화면(작성하기)을 보여 준다. 404로 주지 않는다.

```json
{
  "readingRecordId": 1, "round": 1, "bookId": 1, "canWrite": true,
  "review": {
    "reviewId": 1, "bookId": 1, "rating": 5, "oneLine": "다시 읽고 싶은 책",
    "isSpoiler": false, "isPublic": true, "isBlinded": false, "likeCount": 0,
    "createdAt": "...", "updatedAt": "..."
  },
  "bookReport": {
    "bookReportId": 1, "readingRecordId": 1, "bookId": 1, "content": "...",
    "isPublic": false, "revision": 1, "createdAt": "...", "updatedAt": "..."
  }
}
```

`canWrite`는 회차가 완독 상태인지다.

#### `PUT /api/reading-records/{readingRecordId}/review` → 200 (위와 같은 형식)

완독 회차에서만 된다. 아니면 409 `READING_NOT_COMPLETED`.

```json
{
  "review": { "rating": 5 },
  "bookReport": { "content": "독후감 본문", "isPublic": true }
}
```

- `review` 키를 빼면 리뷰는 그대로다. 리뷰가 없으면 만들고(`rating` 필수), 있으면 보낸 필드만 고친다.
- `bookReport` 키를 빼면 독후감은 그대로다. `"bookReport": null`이나 `"content": ""`는 독후감 삭제다.
- `content` 키 없이 `{ "isPublic": true }`만 보내면 본문은 그대로 두고 공개 여부만 바뀐다.
- 독후감 `content`는 1~2000자, `isPublic` 기본은 비공개다.
- 같은 회차 다시 저장도 이 PUT이다. 한줄평 입력은 독후감 화면에 두지 않는다.

### 리뷰 단독 API

- `POST /api/books/{bookId}/review` → 201 리뷰. 이미 있으면 409 `REVIEW_ALREADY_EXISTS`, 완독 회차가 없으면 409 `READING_NOT_COMPLETED`.
- `GET /api/books/{bookId}/review` → 200 리뷰, 없으면 404 `REVIEW_NOT_FOUND`.
- `PATCH /api/reviews/{reviewId}` → 200 리뷰.

리뷰 필드:

- `rating`: 1~5 정수. 생성 시 필수.
- `oneLine`: 최대 100자, 줄바꿈 불가. `""`를 보내면 한줄평이 지워진다(별점만 남음).
- `isSpoiler`: 기본 false. `isPublic`: 기본 true.
- 신고가 쌓여 블라인드되면 작성자 본인 조회에 `isBlinded: true`가 보인다.

### 독후감 단독 API

- `GET /api/book-reports/{bookReportId}` → 200 독후감
- `PATCH /api/book-reports/{bookReportId}` → 200 독후감. `{ "content": "...", "isPublic": true }` 중 보낸 것만 바뀐다. 내용이 바뀌면 `revision`이 1 오른다.
- `DELETE /api/book-reports/{bookReportId}` → 204

## 4. 한줄평 목록, 별점 통계, 좋아요, 신고 (커뮤니티 탭, 책 검색)

ISBN으로 조회한다. 완독하지 않은 사용자, 책을 검색만 한 사용자도 볼 수 있다. ISBN의 하이픈과 공백은 서버가 지운다.

### `GET /api/reviews?isbn=&sort=latest&page=0&size=20` → 200 페이지

공개되고 블라인드되지 않은, 한줄평이 있는 리뷰만 나온다. `sort`는 `latest`(기본) 또는 `likes`.

```json
{
  "items": [{
    "reviewId": 1, "rating": 4, "oneLine": "Great book again", "isSpoiler": false,
    "likeCount": 1, "isLiked": true, "isMine": false,
    "author": { "userId": 1, "nickname": "alice" },
    "createdAt": "...", "updatedAt": "..."
  }],
  "page": 0, "size": 20, "totalElements": 1, "hasNext": false
}
```

`isSpoiler: true`이면 본문을 가리고 눌러서 보게 한다.

### `GET /api/reviews/rating-summary?isbn=` → 200

블라인드된 리뷰를 뺀 모든 별점(비공개 리뷰, 한줄평 없는 리뷰 포함) 통계다.

```json
{ "isbn": "9791162540640", "averageRating": 3.7, "ratingCount": 3,
  "distribution": { "1": 0, "2": 0, "3": 1, "4": 2, "5": 0 } }
```

`distribution`에는 항상 1~5 키가 모두 있다. 리뷰가 없으면 `averageRating`은 0.0이다.

### 좋아요

- `PUT /api/reviews/{reviewId}/like` → 200 `{ "reviewId": 1, "liked": true, "likeCount": 1 }`
- `DELETE /api/reviews/{reviewId}/like` → 200 `{ "reviewId": 1, "liked": false, "likeCount": 0 }`

여러 번 보내도 결과는 같다. 내 리뷰는 400 `CANNOT_LIKE_OWN_REVIEW`.

### 신고

`POST /api/reviews/{reviewId}/reports` → 201 (본문 없음)

```json
{ "reason": "OTHER", "detail": "책과 관계없는 내용" }
```

- `reason`: `SPOILER` | `ABUSIVE` | `SPAM` | `INAPPROPRIATE` | `OTHER`
- `detail`: `OTHER`면 필수, 최대 300자.
- 같은 리뷰를 다시 신고하면 409 `ALREADY_REPORTED`. 신고 3건이 쌓이면 자동 블라인드되어 목록과 별점 통계에서 빠진다.

## 5. 완독자 커뮤니티 (문장 모음집, 독후감)

같은 ISBN의 책을 완독한 사용자만 다른 완독자의 모음집과 독후감을 본다. 경로의 `bookId`는 내 서재의 책이다.

### `GET /api/books/{bookId}/community` → 200

잠겨 있어도 200이다.

```json
{
  "bookId": 2, "isbn": "9791162540640", "available": true, "unlocked": true, "lockReason": null,
  "completerCount": 3, "publicCollectionCount": 2, "publicBookReportCount": 1
}
```

- `available: false`, `lockReason: "NO_ISBN"`: 직접 등록해 ISBN이 없는 책이다. "직접 등록한 책은 커뮤니티를 이용할 수 없어요"를 보여 준다.
- `unlocked: false`, `lockReason: "NOT_COMPLETED"`: 잠금 화면을 보여 준다. 숫자는 잠겨 있어도 준다.

### `GET /api/books/{bookId}/community/entries?page=0&size=20` → 200 페이지

모음집 또는 독후감을 공개한 완독 회차를 완독일 최신순으로 준다. 잠겨 있으면 403 `COMMUNITY_LOCKED`.

```json
{
  "items": [{
    "readingRecordId": 1, "round": 1, "completedAt": "2026-10-20T22:00:00",
    "author": { "userId": 1, "nickname": "alice" }, "isMine": false,
    "sentenceCollection": {
      "sentenceCount": 3,
      "previewSentences": [{ "sentenceId": 2, "content": "첫 페이지의 한국어 문장", "pageNumber": 10 }]
    },
    "bookReport": { "bookReportId": 1, "preview": "독후감 앞 150자", "length": 22 }
  }],
  "page": 0, "size": 20, "totalElements": 2, "hasNext": false
}
```

공개하지 않았거나 문장이 없는 모음집은 `sentenceCollection: null`, 비공개 독후감은 `bookReport: null`이다. 미리보기 문장은 최대 3개다.

### `GET /api/books/{bookId}/community/entries/{readingRecordId}` → 200

```json
{
  "readingRecordId": 1, "round": 1, "completedAt": "...",
  "author": { "userId": 1, "nickname": "alice" }, "isMine": false,
  "sentenceCollection": { "readingPeriodDays": 40, "recordedDayCount": 1, "sentenceCount": 3, "days": [] },
  "bookReport": { "bookReportId": 1, "content": "...", "createdAt": "...", "updatedAt": "..." }
}
```

`days`는 모음집 API와 같은 형식이다. 공개되지 않은 회차는 404 `COMMUNITY_ENTRY_NOT_FOUND`.

## 6. 관리자 API

`ADMIN` 권한만 호출할 수 있다.

- `GET /api/admin/reviews/reported?blinded=&page=0&size=20`: 신고가 있거나 블라인드된 리뷰를 신고 수 많은 순으로 준다. `blinded`를 빼면 전부다. 항목에는 리뷰 필드와 `author`, `reportCount`, `isBlinded`, `blindedAt`, `reportReasons`(`{ "SPAM": 1, "OTHER": 1 }`)가 있다.
- `PATCH /api/admin/reviews/{reviewId}/blind` `{ "blinded": false }`: 블라인드 해제. 신고 수를 0으로 되돌리고, 신고 기록은 남아 같은 사람은 다시 신고할 수 없다. `true`면 바로 블라인드한다.

## 7. 다른 파트와 맞출 항목

### BE1 (독서, AI 피드백)

1. 병합 후 `ReadingRecordReader`, `BookReader` 포트 구현을 BE1 서비스 기반으로 바꾸고, 임시 `JdbcReadingRecordReader`, `JdbcBookReader`를 지운다. 지금 어댑터가 읽는 컬럼: `reading_records(id, user_id, book_id, round, status, started_at, completed_at)`, `books(id, user_id, title, author, cover_url, isbn, total_pages)`.
2. 책 삭제 시 같은 트랜잭션에서 `ReviewCleanupService.deleteAllOfBook(bookId)`를 호출하거나, `BookDeletedEvent(bookId)`를 만들어 주면 review 쪽 리스너를 붙인다. 리뷰, 독후감, 문장, 모음집 공개 설정을 실제로 지운다.
3. AI 피드백은 `BookReportReader.find(bookReportId)`로 본문을 읽는다. `revision`과 `BookReportUpdatedEvent`로 오래된 피드백을 판단한다. `ai_feedbacks.book_report_id`는 `ON DELETE CASCADE`로 둔다.
4. 커뮤니티 조회용 `books(isbn)`, `reading_records(book_id, status)` 인덱스 요청.
5. `reading_records.is_public`은 review에서 쓰지 않는다. 의미가 정해지면 알려 달라고 요청.
6. 스키마 관리 방식(Flyway 또는 `ddl-auto=update`)을 하나로 맞춘다.

### BE2 (보상)

1. 독후활동 보상을 준다면 아래 이벤트를 구독한다. 발행은 쓰기 트랜잭션 안이므로 `@TransactionalEventListener(phase = AFTER_COMMIT)`를 권장한다. 문장은 `readDate` 기준 하루 1회, 리뷰는 책당 1회, 독후감은 회차당 1회 지급하면 삭제 후 재작성 반복을 막는다.
   - `SentenceCreatedEvent(userId, readingRecordId, sentenceId, readDate)`
   - `ReviewCreatedEvent(userId, bookId, reviewId)`
   - `BookReportCreatedEvent(userId, readingRecordId, bookReportId, revision)`, `BookReportUpdatedEvent`(같은 필드, 내용이 바뀔 때만), `BookReportDeletedEvent(userId, readingRecordId, bookReportId)`
2. 공용 클래스 통일: `global/error/ErrorCode`, `global/error/BusinessException`, `global/dto/PageResponse`를 이 브랜치에서 추가했다. `BaseTimeEntity`, `JpaAuditingConfig`는 reward 브랜치와 같은 내용이다.
3. 회원 탈퇴 시 `UserWithdrawnEvent(userId)`가 사용자 삭제 전에 같은 트랜잭션에서 동기 발행된다. 보상 데이터 정리에 쓸 수 있다.

### FE1 (독서 화면)

1. 세션 저장 성공 뒤 `POST /sentences`를 따로 호출한다. 요청은 `content`, `pageNumber`만 보낸다. 경로 ID는 세션 ID가 아니라 회차 ID다.
2. `Sentence.page`를 `pageNumber`로 바꾸고, 표시 날짜는 `readDate`를 쓴다.
3. 책 상세에서 읽는 중에도 모음집으로 들어가 조회, 수정할 수 있게 진입점을 둔다.

### FE2 (독후활동 화면)

1. 통합 API는 `PUT`이고 응답이 `review`, `bookReport`로 나뉜다. null은 빈 화면이다.
2. 독후감 화면에는 별점과 독후감만 둔다. 별점은 책 리뷰의 `rating`이다.

### FE1·FE2 공통 (커뮤니티, 책 검색)

1. 별점 분포, 한줄평 목록, 좋아요, 신고는 ISBN API다. 커뮤니티 탭과 책 검색 양쪽에서 같은 API를 쓴다.
2. 모음집·독후감 항목 목록과 상세는 완독자 전용이다. 403 `COMMUNITY_LOCKED`는 잠금 화면, `available: false`는 직접 등록한 책 안내로 처리한다.
3. 공개 토글은 "문장 모음집 공개"와 "독후감 공개" 두 개이고 서로 영향을 주지 않는다. 둘 다 기본은 비공개다.
4. 페이지 번호는 0부터다. BE1 도서 검색은 1부터라 팀 차원에서 맞출지 정한다.
