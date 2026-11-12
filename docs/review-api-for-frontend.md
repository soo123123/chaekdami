# review-api-for-frontend

# 독후활동 API (프론트 전달용)

앱이 호출하는 서버 주소는 `http://localhost:8080` 이다.

요청은 `{서버 주소}/api/...` 로 보낸다. 이 주소는 앱 화면 주소가 아니다.

로그인, 토큰 갱신, 로그아웃은 인증 API를 따른다. 이 문서의 API는 전부 로그인이 필요하다.

---

## 공통으로 지킬 것

**본문이 있는 요청**

```
Content-Type: application/json
```

**로그인이 필요한 요청**

로그인 응답의 `accessToken` 변수 값을 헤더에 넣는다. `Bearer` 와 값 사이에 공백 한 칸이 있어야 한다.

```
Authorization: Bearer {accessToken}
```

쿠키는 쓰지 않는다. `{accessToken}` 글자를 그대로 보내지 않는다.

**용어**

- `bookId`: 내 서재의 책 번호
- `readingRecordId`: 그 책의 회차 번호. 1회독, 2회독이다. 세션 번호가 아니다
- `sentenceId`, `reviewId`, `bookReportId`: 각 기록의 번호
- 작성자 번호는 `author.userId` 다. 인증 API 사용자 번호 필드명 `id` 와 다르다

**날짜**

날짜는 `"2026-11-09"`, 시각은 `"2026-11-09T01:58:43.801149"` 다. 한국 시간이고 시간대 표기는 없다.

**상태 코드**

| 코드 | 의미 | 프론트에서 할 일 |
| --- | --- | --- |
| 200, 201 | 성공. JSON 본문이 있다 | `response.json()` 으로 읽는다 |
| 204 | 성공. JSON 본문이 없다 | `response.json()` 을 호출하지 않는다 |
| 400, 401, 403, 404, 409, 500 | 실패. 아래 에러 JSON이 있다 | `code` 로 분기한다 |

신고 `POST /api/reviews/{reviewId}/reports` 만 예외다. 성공이 201이면서 본문이 없다. `response.json()` 을 호출하지 않는다.

204는 실패가 아니다. 문장 삭제, 독후감 삭제가 이 코드다.

다른 사용자의 회차, 책, 문장, 리뷰, 독후감은 403이 아니라 404다. 403은 완독자 커뮤니티 잠금과 관리자 API에만 쓴다.

**목록**

목록 API의 `page` 는 0부터다. `size` 는 1 이상 50 이하이고, 기본은 20이다.

```json
{ "items": [], "page": 0, "size": 20, "totalElements": 35, "hasNext": true }
```

`hasNext` 가 true면 다음 페이지가 있다.

---

## API 목록

같은 주소라도 메서드가 다르면 다른 기능이다.

| 메서드 | 주소 | 하는 일 | 헤더의 Access Token | 성공 |
| --- | --- | --- | --- | --- |
| POST | `/api/reading-records/{readingRecordId}/sentences` | 문장 추가 | 필요 | 201 |
| GET | `/api/reading-records/{readingRecordId}/sentences` | 회차 문장 목록 | 필요 | 200 |
| PATCH | `/api/sentences/{sentenceId}` | 문장 수정 | 필요 | 200 |
| DELETE | `/api/sentences/{sentenceId}` | 문장 삭제 | 필요 | 204 |
| GET | `/api/reading-records/{readingRecordId}/sentence-collection` | 회차 문장 모음집 | 필요 | 200 |
| GET | `/api/me/sentence-collections` | 내 모음집 목록 | 필요 | 200 |
| GET | `/api/reading-records/{readingRecordId}/review` | 독후활동 화면 조회 | 필요 | 200 |
| PUT | `/api/reading-records/{readingRecordId}/review` | 독후활동 화면 저장 | 필요 | 200 |
| POST | `/api/books/{bookId}/review` | 리뷰 작성 | 필요 | 201 |
| GET | `/api/books/{bookId}/review` | 내 리뷰 조회 | 필요 | 200 |
| PATCH | `/api/reviews/{reviewId}` | 리뷰 수정 | 필요 | 200 |
| GET | `/api/book-reports/{bookReportId}` | 독후감 조회 | 필요 | 200 |
| PATCH | `/api/book-reports/{bookReportId}` | 독후감 수정 | 필요 | 200 |
| DELETE | `/api/book-reports/{bookReportId}` | 독후감 삭제 | 필요 | 204 |
| GET | `/api/reviews` | ISBN 한줄평 목록 | 필요 | 200 |
| GET | `/api/reviews/rating-summary` | ISBN 별점 통계 | 필요 | 200 |
| PUT | `/api/reviews/{reviewId}/like` | 좋아요 | 필요 | 200 |
| DELETE | `/api/reviews/{reviewId}/like` | 좋아요 취소 | 필요 | 200 |
| POST | `/api/reviews/{reviewId}/reports` | 한줄평 신고 | 필요 | 201 |
| GET | `/api/books/{bookId}/community` | 완독자 커뮤니티 요약 | 필요 | 200 |
| GET | `/api/books/{bookId}/community/entries` | 커뮤니티 항목 목록 | 필요 | 200 |
| GET | `/api/books/{bookId}/community/entries/{readingRecordId}` | 커뮤니티 항목 상세 | 필요 | 200 |
| GET | `/api/admin/reviews/reported` | 신고된 리뷰 목록 | 필요, ADMIN | 200 |
| PATCH | `/api/admin/reviews/{reviewId}/blind` | 블라인드 또는 해제 | 필요, ADMIN | 200 |

모음집 공개를 바꾸는 주소는 독서 API `PATCH /api/reading-records/{readingRecordId}` 다. `PUT /api/reading-records/{readingRecordId}/sentence-collection/visibility` 는 없다.

---

## 실패 응답

실패는 항상 이 모양이다.

```json
{
  "code": "VALIDATION_ERROR",
  "message": "요청 값이 올바르지 않습니다.",
  "fields": [
    { "field": "pageNumber", "message": "쪽 번호는 1 이상 300 이하여야 합니다." }
  ]
}
```

`fields` 는 입력값 검사에 실패했을 때만 있다. 그 안의 `field` 로 어떤 칸에 메시지를 붙일지 정한다.

없는 데이터처럼 리소스 자체가 없을 때는 `fields` 가 없다.

```json
{
  "code": "SENTENCE_NOT_FOUND",
  "message": "문장을 찾을 수 없습니다."
}
```

| HTTP | code | 언제 | 화면 |
| --- | --- | --- | --- |
| 400 | `VALIDATION_ERROR` | 형식, 길이, 쪽 번호, 별점, 정렬값, 필수값 누락 | `fields` 의 메시지를 해당 입력칸에 표시 |
| 400 | `CANNOT_LIKE_OWN_REVIEW` | 내 한줄평에 좋아요 | 메시지 표시 |
| 400 | `CANNOT_REPORT_OWN_REVIEW` | 내 한줄평 신고 | 메시지 표시 |
| 401 | `UNAUTHORIZED` | Access Token이 없거나 만료되었거나 폐기됨 | 인증 API의 refresh를 시도하고, 그것도 실패하면 로그인 화면 |
| 403 | `COMMUNITY_LOCKED` | 완독하지 않은 책의 커뮤니티 항목 조회 | 잠금 화면 |
| 403 | `FORBIDDEN` | 일반 사용자의 관리자 API 호출 | 메시지 표시 |
| 404 | `READING_RECORD_NOT_FOUND` | 회차가 없거나 내 회차가 아님 | 없는 화면 |
| 404 | `BOOK_NOT_FOUND` | 책이 없거나 내 책이 아님 | 없는 화면 |
| 404 | `SENTENCE_NOT_FOUND` | 문장이 없거나 내 문장이 아님 | 없는 화면 |
| 404 | `REVIEW_NOT_FOUND` | 리뷰가 없음. 좋아요에서는 비공개, 블라인드, 한줄평 없는 리뷰도 이 코드 | 없는 화면 |
| 404 | `BOOK_REPORT_NOT_FOUND` | 독후감이 없거나 내 독후감이 아님 | 없는 화면 |
| 404 | `COMMUNITY_ENTRY_NOT_FOUND` | 커뮤니티에 공개되지 않은 회차 | 없는 화면 |
| 409 | `READING_NOT_COMPLETED` | 완독 전에 리뷰 또는 독후활동 저장 | 완독 후 작성할 수 있다고 표시 |
| 409 | `REVIEW_ALREADY_EXISTS` | 같은 책에 리뷰를 다시 생성 | 수정을 호출 |
| 409 | `BOOK_REPORT_ALREADY_EXISTS` | 같은 회차에 독후감이 동시에 생성됨 | 다시 조회한 뒤 수정 |
| 409 | `ALREADY_REPORTED` | 같은 한줄평을 다시 신고 | 이미 신고했다고 표시 |
| 500 | `INTERNAL_ERROR` | 서버 오류 | 잠시 후 다시 시도하라고 표시 |

---

## 각 API

### 문장 추가

`POST /api/reading-records/{readingRecordId}/sentences`

모음집 화면에서 문장을 더할 때 호출한다. 내 회차이면 읽는 중이어도 저장된다. 완독 뒤에 마지막 날 문장을 올려도 된다.

독서 종료 화면의 문장은 이 API를 따로 호출하지 않는다. 독서 API `POST /api/reading-sessions` 본문의 `sentence` 로 보낸다. 세션 저장과 함께 모음집에 들어간다. 비어 있으면 문장은 저장되지 않고, 쪽 번호는 붙지 않는다. 500자를 넘으면 세션 저장 전체가 400이고 `fields[].field` 는 `"sentence"` 다.

요청

```
POST /api/reading-records/1/sentences
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "content": "우리는 모두 각자의 속도로 자란다.",
  "pageNumber": 42
}
```

`content` 는 필수다. `pageNumber` 는 생략할 수 있다. 저장 날짜 `readDate` 는 서버가 한국 날짜로 정한다.

성공 `201`

```json
{
  "sentenceId": 1,
  "readingRecordId": 1,
  "bookId": 1,
  "readDate": "2026-11-09",
  "pageNumber": 42,
  "content": "우리는 모두 각자의 속도로 자란다.",
  "createdAt": "2026-11-09T01:58:43.78",
  "updatedAt": "2026-11-09T01:58:43.78"
}
```

### 회차 문장 목록

`GET /api/reading-records/{readingRecordId}/sentences`

최신순이다. 독서 완료 화면의 오늘 문장은 `readDate` 가 오늘인 첫 항목이다.

요청

```
GET /api/reading-records/1/sentences
Authorization: Bearer {accessToken}
```

성공 `200`. 본문은 문장 추가와 같은 객체의 배열이다. 없으면 `[]` 다.

### 문장 수정

`PATCH /api/sentences/{sentenceId}`

보낸 필드만 바뀐다. `readDate` 는 바뀌지 않는다.

`"pageNumber": null` 을 보내면 쪽 번호가 지워진다. 키를 빼면 쪽 번호는 그대로다.

요청

```
PATCH /api/sentences/1
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "content": "고친 문장",
  "pageNumber": null
}
```

성공 `200`. 문장 추가와 같은 JSON이다.

### 문장 삭제

`DELETE /api/sentences/{sentenceId}`

요청

```
DELETE /api/sentences/1
Authorization: Bearer {accessToken}
```

성공 `204`. 본문이 없다.

### 회차 문장 모음집

`GET /api/reading-records/{readingRecordId}/sentence-collection`

읽는 중인 회차도 200이다. 날짜 오름차순으로 묶고, 하루 안에서는 쪽 번호순이다. 쪽 번호가 없는 문장은 그 날의 뒤에 온다.

요청

```
GET /api/reading-records/1/sentence-collection
Authorization: Bearer {accessToken}
```

성공 `200`

```json
{
  "readingRecordId": 1,
  "round": 1,
  "status": "COMPLETED",
  "book": {
    "bookId": 1,
    "title": "Book A",
    "author": "Author",
    "coverUrl": null,
    "totalPages": 300
  },
  "startedAt": "2026-10-01T20:00:00",
  "completedAt": "2026-10-20T22:00:00",
  "isPublic": false,
  "readingPeriodDays": 40,
  "recordedDayCount": 1,
  "sentenceCount": 2,
  "days": [
    {
      "readDate": "2026-11-09",
      "dayNumber": 40,
      "sentences": [
        {
          "sentenceId": 2,
          "content": "첫 페이지의 문장",
          "pageNumber": 10,
          "createdAt": "2026-11-09T01:58:43.78",
          "updatedAt": "2026-11-09T01:58:43.78"
        }
      ]
    }
  ]
}
```

- `status`: `"NOT_STARTED"`, `"IN_PROGRESS"`, `"COMPLETED"`
- `dayNumber`: 회차 시작일을 1일차로 센 날
- `readingPeriodDays`: 시작일부터 완독일까지. 읽는 중이면 오늘까지다. 완독 뒤에 문장을 더 남기면 마지막 기록일까지 늘어난다
- `recordedDayCount`: 문장을 남긴 날 수
- `isPublic`: 이 회차 문장 모음집을 완독자 커뮤니티에 보일지다. 기본은 `false` 다

`isPublic` 을 바꾸는 요청은 독서 API다. 회차를 만들 때와 나중에 고칠 때 둘 다 된다. 독후감 공개와는 따로 동작한다.

```
PATCH /api/reading-records/1
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "isPublic": true
}
```

회차 생성은 `POST /api/books/{bookId}/reading-records` 이고, 본문에 `"isPublic": true` 를 넣으면 공개로 시작한다. 키를 빼면 비공개다.

### 내 모음집 목록

`GET /api/me/sentence-collections`

문장이 하나 이상 있는 내 회차를 마지막 기록일 최신순으로 준다. 읽는 중인 회차도 포함한다. `bookId` 를 주면 그 책만 준다.

요청

```
GET /api/me/sentence-collections?page=0&size=20
Authorization: Bearer {accessToken}
```

성공 `200`

```json
{
  "items": [
    {
      "readingRecordId": 1,
      "round": 1,
      "status": "COMPLETED",
      "book": { "bookId": 1, "title": "Book A", "author": "Author", "coverUrl": null },
      "completedAt": "2026-10-20T22:00:00",
      "sentenceCount": 3,
      "lastReadDate": "2026-11-09",
      "previewSentence": "첫 페이지의 문장"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "hasNext": false
}
```

`bookId` 에 해당하는 모음집이 없으면 `items` 는 `[]`, `totalElements` 는 0이다.

### 독후활동 화면 조회

`GET /api/reading-records/{readingRecordId}/review`

리뷰와 독후감을 한 번에 준다. 없는 쪽은 `null` 이다. `null` 이면 작성 화면을 보여 준다. 없어서 404로 주지 않는다.

리뷰는 책당 1개, 독후감은 회차당 1개다.

요청

```
GET /api/reading-records/1/review
Authorization: Bearer {accessToken}
```

성공 `200`

```json
{
  "readingRecordId": 1,
  "round": 1,
  "bookId": 1,
  "canWrite": true,
  "review": {
    "reviewId": 1,
    "bookId": 1,
    "rating": 5,
    "oneLine": "다시 읽고 싶은 책",
    "isSpoiler": false,
    "isPublic": true,
    "isBlinded": false,
    "likeCount": 0,
    "createdAt": "2026-11-09T01:58:43.78",
    "updatedAt": "2026-11-09T01:58:43.78"
  },
  "bookReport": {
    "bookReportId": 1,
    "readingRecordId": 1,
    "bookId": 1,
    "content": "독후감 본문",
    "isPublic": false,
    "revision": 1,
    "createdAt": "2026-11-09T01:58:43.78",
    "updatedAt": "2026-11-09T01:58:43.78"
  }
}
```

`canWrite` 는 이 회차가 완독인지다. `false` 이면 작성 버튼을 막는다.

`isBlinded` 가 true면 신고로 가려진 내 리뷰다. 작성자 본인 조회에서만 이 값이 보인다.

### 독후활동 화면 저장

`PUT /api/reading-records/{readingRecordId}/review`

완독 회차에서만 된다. 아니면 409 `READING_NOT_COMPLETED` 다. 성공 응답은 조회와 같은 JSON이다.

이 화면에는 별점과 독후감만 둔다. 한줄평 입력칸은 두지 않는다. 별점은 책 리뷰의 `rating` 이다.

요청

```
PUT /api/reading-records/1/review
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "review": { "rating": 5 },
  "bookReport": { "content": "독후감 본문", "isPublic": true }
}
```

- `review` 키를 빼면 리뷰는 그대로다. 리뷰가 없으면 만들고 `rating` 이 필수다. 있으면 보낸 필드만 고친다
- `bookReport` 키를 빼면 독후감은 그대로다
- `"bookReport": null` 또는 `"content": ""` 는 독후감 삭제다
- `"bookReport": { "isPublic": true }` 처럼 본문 키 없이 보내면 본문은 그대로 두고 공개만 바뀐다
- 같은 회차를 다시 저장할 때도 이 PUT이다

리뷰를 처음 만들 때의 기본값은 `isSpoiler: false`, `isPublic: true` 다. 독후감 공개의 기본값은 `false` 다.

### 리뷰 작성

`POST /api/books/{bookId}/review`

그 책에 완독 회차가 하나라도 있어야 한다. 책당 1개다. 이미 있으면 409 `REVIEW_ALREADY_EXISTS` 이고, 이 때는 `PATCH /api/reviews/{reviewId}` 로 고친다.

요청

```
POST /api/books/1/review
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "rating": 5,
  "oneLine": "다시 읽고 싶은 책",
  "isSpoiler": false,
  "isPublic": true
}
```

`rating` 만 필수다. `oneLine`, `isSpoiler`, `isPublic` 은 생략할 수 있다.

성공 `201`. 독후활동 화면의 `review` 객체와 같다.

### 내 리뷰 조회

`GET /api/books/{bookId}/review`

없으면 404 `REVIEW_NOT_FOUND` 다. 독후활동 화면 조회는 이 경우에도 200이고 `review` 가 null이다. 두 API를 구분한다.

요청

```
GET /api/books/1/review
Authorization: Bearer {accessToken}
```

성공 `200`. 리뷰 객체다.

### 리뷰 수정

`PATCH /api/reviews/{reviewId}`

보낸 필드만 바뀐다. `"oneLine": ""` 을 보내면 한줄평이 지워지고 별점만 남는다.

요청

```
PATCH /api/reviews/1
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "rating": 4,
  "oneLine": "",
  "isSpoiler": true,
  "isPublic": false
}
```

성공 `200`. 리뷰 객체다.

### 독후감 조회

`GET /api/book-reports/{bookReportId}`

요청

```
GET /api/book-reports/1
Authorization: Bearer {accessToken}
```

성공 `200`. 독후활동 화면의 `bookReport` 객체와 같다.

### 독후감 수정

`PATCH /api/book-reports/{bookReportId}`

보낸 필드만 바뀐다. 본문이 바뀌면 `revision` 이 1 오른다. 공개만 바꾸면 `revision` 은 그대로다. 본문을 지우는 값은 여기서 받지 않는다. 지울 때는 삭제를 호출한다.

요청

```
PATCH /api/book-reports/1
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "content": "고친 독후감",
  "isPublic": true
}
```

성공 `200`. 독후감 객체다.

### 독후감 삭제

`DELETE /api/book-reports/{bookReportId}`

요청

```
DELETE /api/book-reports/1
Authorization: Bearer {accessToken}
```

성공 `204`. 본문이 없다.

### 한줄평 목록

`GET /api/reviews`

ISBN으로 조회한다. 완독하지 않은 사용자, 책을 검색만 한 사용자도 볼 수 있다. 하이픈과 공백은 서버가 지운다.

공개되고, 블라인드되지 않고, 한줄평이 있는 리뷰만 나온다.

요청

```
GET /api/reviews?isbn=979-11-6254-064-0&sort=latest&page=0&size=20
Authorization: Bearer {accessToken}
```

`sort` 는 `latest`(기본, 최신순) 또는 `likes`(좋아요 많은 순)다.

성공 `200`

```json
{
  "items": [
    {
      "reviewId": 1,
      "rating": 4,
      "oneLine": "다시 읽고 싶은 책",
      "isSpoiler": false,
      "likeCount": 1,
      "isLiked": true,
      "isMine": false,
      "author": { "userId": 2, "nickname": "alice" },
      "createdAt": "2026-11-09T01:58:43.78",
      "updatedAt": "2026-11-09T01:58:43.78"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "hasNext": false
}
```

`isSpoiler` 가 true면 본문을 가리고, 누르면 보여 준다. `isLiked` 는 내가 좋아요를 눌렀는지, `isMine` 은 내 글인지다.

### 별점 통계

`GET /api/reviews/rating-summary`

한줄평 목록과 같은 ISBN 규칙이다. 블라인드된 리뷰만 빠지고, 비공개 리뷰와 한줄평 없는 리뷰의 별점도 포함한다. 누가 썼는지는 주지 않는다.

요청

```
GET /api/reviews/rating-summary?isbn=9791162540640
Authorization: Bearer {accessToken}
```

성공 `200`

```json
{
  "isbn": "9791162540640",
  "averageRating": 3.7,
  "ratingCount": 3,
  "distribution": { "1": 0, "2": 0, "3": 1, "4": 2, "5": 0 }
}
```

`distribution` 에는 `"1"` 부터 `"5"` 까지 항상 있다. 리뷰가 없으면 `averageRating` 은 `0.0`, `ratingCount` 는 0이다. `isbn` 은 서버가 정리한 값이다.

### 좋아요

`PUT /api/reviews/{reviewId}/like`

여러 번 눌러도 한 번 누른 것과 같다.

요청

```
PUT /api/reviews/1/like
Authorization: Bearer {accessToken}
```

성공 `200`

```json
{ "reviewId": 1, "liked": true, "likeCount": 1 }
```

내 글은 400 `CANNOT_LIKE_OWN_REVIEW` 다. 비공개, 블라인드, 한줄평이 없는 글은 404 `REVIEW_NOT_FOUND` 다.

### 좋아요 취소

`DELETE /api/reviews/{reviewId}/like`

여러 번 호출해도 취소된 상태가 유지된다.

요청

```
DELETE /api/reviews/1/like
Authorization: Bearer {accessToken}
```

성공 `200`

```json
{ "reviewId": 1, "liked": false, "likeCount": 0 }
```

### 한줄평 신고

`POST /api/reviews/{reviewId}/reports`

성공 `201`. 본문이 없다.

요청

```
POST /api/reviews/1/reports
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "reason": "OTHER",
  "detail": "책과 관계없는 내용"
}
```

`reason` 은 `SPOILER`, `ABUSIVE`, `SPAM`, `INAPPROPRIATE`, `OTHER` 중 하나다. `OTHER` 는 `detail` 이 필수다.

같은 글을 다시 신고하면 409 `ALREADY_REPORTED` 다. 서로 다른 사람의 신고가 3건이 되면 그 글은 블라인드되어 목록과 별점 통계에서 빠진다.

### 완독자 커뮤니티 요약

`GET /api/books/{bookId}/community`

`bookId` 는 내 서재의 책이다. 같은 ISBN을 완독한 사람들의 모음집과 독후감으로 들어간다. 잠겨 있어도 200이다. 잠금 화면에서 완독자 수를 보여 주기 때문이다.

요청

```
GET /api/books/1/community
Authorization: Bearer {accessToken}
```

성공 `200`

```json
{
  "bookId": 1,
  "isbn": "9791162540640",
  "available": true,
  "unlocked": true,
  "lockReason": null,
  "completerCount": 3,
  "publicCollectionCount": 2,
  "publicBookReportCount": 1
}
```

- `available` 이 false이고 `lockReason` 이 `"NO_ISBN"` 이면 직접 등록한 책이다. "직접 등록한 책은 커뮤니티를 이용할 수 없어요"를 보여 준다
- `unlocked` 가 false이고 `lockReason` 이 `"NOT_COMPLETED"` 이면 잠금 화면을 보여 준다. 숫자는 잠겨 있어도 준다
- `completerCount` 는 사람 수다. `publicCollectionCount` 와 `publicBookReportCount` 는 공개된 회차 수다

### 커뮤니티 항목 목록

`GET /api/books/{bookId}/community/entries`

모음집 또는 독후감을 공개한 완독 회차를 완독일 최신순으로 준다. 잠겨 있으면 403 `COMMUNITY_LOCKED` 다.

요청

```
GET /api/books/1/community/entries?page=0&size=20
Authorization: Bearer {accessToken}
```

성공 `200`

```json
{
  "items": [
    {
      "readingRecordId": 1,
      "round": 1,
      "completedAt": "2026-10-20T22:00:00",
      "author": { "userId": 2, "nickname": "alice" },
      "isMine": false,
      "sentenceCollection": {
        "sentenceCount": 3,
        "previewSentences": [
          { "sentenceId": 2, "content": "첫 페이지의 문장", "pageNumber": 10 }
        ]
      },
      "bookReport": { "bookReportId": 1, "preview": "독후감 앞부분", "length": 22 }
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "hasNext": false
}
```

공개하지 않았거나 문장이 없는 모음집은 `sentenceCollection: null` 이다. 비공개 독후감은 `bookReport: null` 이다. 미리보기 문장은 최대 3개다. `preview` 는 독후감 앞 150자다. `length` 는 전체 글자 수다.

### 커뮤니티 항목 상세

`GET /api/books/{bookId}/community/entries/{readingRecordId}`

잠겨 있으면 403 `COMMUNITY_LOCKED` 다. 공개되지 않은 회차는 404 `COMMUNITY_ENTRY_NOT_FOUND` 다.

요청

```
GET /api/books/1/community/entries/1
Authorization: Bearer {accessToken}
```

성공 `200`

```json
{
  "readingRecordId": 1,
  "round": 1,
  "completedAt": "2026-10-20T22:00:00",
  "author": { "userId": 2, "nickname": "alice" },
  "isMine": false,
  "sentenceCollection": {
    "readingPeriodDays": 40,
    "recordedDayCount": 1,
    "sentenceCount": 3,
    "days": []
  },
  "bookReport": {
    "bookReportId": 1,
    "content": "독후감 본문",
    "createdAt": "2026-11-09T01:58:43.78",
    "updatedAt": "2026-11-09T01:58:43.78"
  }
}
```

`days` 는 회차 문장 모음집의 `days` 와 같은 모양이다. 비공개인 쪽은 `null` 이다.

### 신고된 리뷰 목록

`GET /api/admin/reviews/reported`

`ADMIN` 만 호출한다. 일반 사용자는 403 `FORBIDDEN` 이다. 신고가 있거나 블라인드된 리뷰를 신고 수 많은 순으로 준다.

요청

```
GET /api/admin/reviews/reported?page=0&size=20
Authorization: Bearer {accessToken}
```

`blinded` 를 빼면 전부다. `blinded=true` 는 블라인드된 글만, `blinded=false` 는 신고는 있으나 아직 블라인드되지 않은 글만 준다.

성공 `200`

```json
{
  "items": [
    {
      "reviewId": 1,
      "author": { "userId": 2, "nickname": "alice" },
      "bookId": 1,
      "isbn": "9791162540640",
      "rating": 4,
      "oneLine": "다시 읽고 싶은 책",
      "isSpoiler": false,
      "isPublic": true,
      "reportCount": 3,
      "isBlinded": true,
      "blindedAt": "2026-11-09T02:10:00",
      "reportReasons": { "SPAM": 1, "OTHER": 1, "SPOILER": 1 },
      "createdAt": "2026-11-09T01:58:43.78",
      "updatedAt": "2026-11-09T02:10:00"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "hasNext": false
}
```

### 블라인드 처리

`PATCH /api/admin/reviews/{reviewId}/blind`

`ADMIN` 만 호출한다.

`"blinded": false` 는 블라인드를 푼다. 신고 수가 0으로 돌아가고, 목록과 별점 통계에 다시 나온다. 신고 기록은 남아서 같은 사람은 다시 신고할 수 없다.

`"blinded": true` 는 바로 블라인드한다.

요청

```
PATCH /api/admin/reviews/1/blind
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "blinded": false
}
```

성공 `200`. 신고된 리뷰 목록의 항목과 같은 JSON이다.

---

## 입력 규칙

| 항목 | 규칙 |
| --- | --- |
| 문장 `content` | 앞뒤 공백을 지운 뒤 1~500자 |
| 문장 `pageNumber` | 생략 가능. 1 이상, 그 책의 전체 쪽수 이하 |
| 세션 `sentence` | 독서 종료 저장에 넣는 문장. 규칙과 길이 제한은 문장 `content` 와 같다. 쪽 번호는 저장되지 않는다 |
| 별점 `rating` | 1 이상 5 이하 정수. 리뷰를 만들 때 필수 |
| 한줄평 `oneLine` | 최대 100자. 줄바꿈 불가. 빈 문자열이면 한줄평 삭제 |
| 리뷰 `isSpoiler` | 생략하면 false |
| 리뷰 `isPublic` | 생략하면 true. 한줄평 목록에 보일지다 |
| 독후감 `content` | 1~2000자. 통합 저장에서 빈 문자열이면 삭제 |
| 독후감 `isPublic` | 생략하면 false. 완독자 커뮤니티에 보일지다 |
| 모음집 공개 | 회차 `isPublic`. 생략하면 false. 독서 API로 바꾼다 |
| 신고 `reason` | `SPOILER`, `ABUSIVE`, `SPAM`, `INAPPROPRIATE`, `OTHER` |
| 신고 `detail` | `OTHER` 면 필수. 최대 300자 |
| `isbn` | 필수. 숫자와 `X` 만 남기고, `x` 는 대문자로 맞춘다 |
| `sort` | `latest` 또는 `likes` |
| `page` | 0 이상 |
| `size` | 1 이상 50 이하. 기본 20 |

회차 `status` 는 `"NOT_STARTED"`, `"IN_PROGRESS"`, `"COMPLETED"` 다.

공개는 두 개다. 회차 `isPublic` 은 문장 모음집, 독후감 `isPublic` 은 독후감이다. 둘은 서로 영향을 주지 않고, 기본은 둘 다 비공개다. 리뷰 `isPublic` 은 한줄평 목록용이고 기본은 공개다.

---

## 토큰이 만료됐을 때

1. API가 401 `UNAUTHORIZED` 를 반환한다.
2. 인증 API와 같이, 저장해 둔 `refreshToken` 으로 `POST /api/auth/refresh` 를 호출한다.
3. 200이면 새 토큰 2개를 저장하고, 실패했던 요청을 새 Access Token으로 다시 보낸다.
4. refresh도 401이면 토큰을 지우고 로그인 화면으로 보낸다.

---

## 프론트 환경 값

프론트가 넣는 값은 API 서버 주소뿐이다.

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

실제 요청 주소는 `{EXPO_PUBLIC_API_BASE_URL}/api/reading-records/1/sentences` 처럼 만든다.

웹으로 실행할 때 서버가 허용하는 출처는 `http://localhost` 와 `http://127.0.0.1` 의 모든 포트다. 다른 주소에서 웹을 띄우면 서버 CORS 설정이 추가로 필요하다.

`JWT_SECRET`, `DB_PASSWORD` 는 서버만 가진다. 프론트 코드와 앱 환경 변수에 넣지 않는다.
