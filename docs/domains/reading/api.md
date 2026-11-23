> 기준: feature/003-session-sentence (스펙 003) · 최종 확인: 2026-11-22 · 담당: BE1

# reading API

공통 규칙: [conventions/api.md](../../conventions/api.md)
모든 API는 로그인이 필요하다. 컨트롤러는 `X-User-Id` 헤더로 사용자를 받지만 앱은 보내지 않아도 된다 (토큰으로 대체).

## 목록

| 메서드 | 경로 | 설명 | 성공 | 상태 |
|---|---|---|---|---|
| GET | `/api/books/search` | 도서 검색 (YES24) | 200 | ✅ |
| GET | `/api/books/search/{itemId}` | 검색한 책 상세 | 200 | ✅ |
| POST | `/api/books` | 서재에 책 등록 (+1회차 자동 생성) | 201 | ✅ |
| GET | `/api/books` | 내 서재 목록 (`?status=` 필터) | 200 | ✅ |
| GET | `/api/books/{bookId}` | 내 서재 책 상세 | 200 | ✅ |
| DELETE | `/api/books/{bookId}` | 서재에서 제거 (기록·세션·인증 포함) | 204 | ✅ |
| POST | `/api/books/{bookId}/reading-records` | 새 회차 시작 (다회독) | 201 | ✅ |
| GET | `/api/books/{bookId}/reading-records` | 책의 회차별 기록 (최신 먼저) | 200 | ✅ |
| GET | `/api/reading-records/{id}` | 독서 기록 상세 | 200 | ✅ |
| PATCH | `/api/reading-records/{id}` | 현재 페이지·목표·메모·공개 여부 수정 | 200 | ✅ |
| POST | `/api/reading-records/{id}/complete` | 완독 처리 | 200 | ✅ |
| POST | `/api/reading-sessions` | 독서 종료 저장 (세션) | 201 | ✅ |
| GET | `/api/reading-records/{id}/sessions` | 회차의 세션 목록 (최근 먼저) | 200 | ✅ |
| GET | `/api/me/reading-today` | 오늘 독서 요약 | 200 | ✅ |
| GET | `/api/me/reading-stats` | 독서 통계 | 200 | ✅ |
| POST | `/api/reading-records/{id}/certifications` | 독서 인증 (사진 → AI 글자 추출 → 판정) | 201 | ✅ |
| GET | `/api/reading-records/{id}/certifications` | 회차의 인증 목록 (최신 먼저) | 200 | ✅ |

---

## 도서 검색

### GET /api/books/search

YES24를 검색한다. "이 책이 맞나?" 확인용 정보만 주고, 쪽수·소개는 주지 않는다. ISBN이 없는 세트 상품은 뺀다.

| 파라미터 | 필수 | 기본 | 값 |
|---|---|---|---|
| `query` | ✅ | | 검색어 |
| `category` | | `BOOK` | `ALL` · `BOOK`(국내) · `FOREIGN`(해외) · `EBOOK` (대소문자 무관) |
| `sort` | | `RELATION` | `DEFAULT` · `RELATION` · `RECENT` · `REG_DTS` |
| `page` | | 1 | 1부터 |
| `pageSize` | | 20 | 1~50 (넘으면 50으로) |

코드: `BookController.searchBooks` → `BookSearchService.search` → `Yes24Client`

```json
{
  "items": [
    {
      "itemId": 69655504,
      "isbn": "9791162540640",
      "title": "아주 작은 습관의 힘",
      "author": "제임스 클리어 저/이한이 역",
      "publisher": "비즈니스북스",
      "publishedDate": "2019-02-26",
      "coverUrl": "https://image.yes24.com/goods/69655504/L"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 17
}
```

- 결과가 없어도 200 + `items: []`
- `totalCount`는 YES24 전체 건수라 세트 상품을 뺀 `items` 수와 다를 수 있다. 다음 페이지 여부: `page * pageSize < totalCount`

### GET /api/books/search/{itemId}

검색에서 고른 책 한 권의 쪽수·ISBN·소개. **필드 이름이 등록 요청과 같아서** 사용자가 확인·수정한 뒤 그대로 `POST /api/books` 본문으로 쓴다.

```json
{
  "itemId": 69655504,
  "title": "아주 작은 습관의 힘",
  "author": "제임스 클리어 저/이한이 역",
  "isbn": "9791162540640",
  "publisher": "비즈니스북스",
  "publishedDate": "2019-02-26",
  "coverUrl": "https://image.yes24.com/goods/69655504/L",
  "description": "…",
  "totalPages": 360
}
```

`description`, `totalPages`는 `null`일 수 있다. `totalPages`가 없으면 등록 화면에서 직접 입력받는다.

## 서재

### POST /api/books

내 서재에 책을 담고, **1회차 독서 기록(`NOT_STARTED`)을 자동으로 만든다.**

```json
// YES24 책: 검색 상세 응답 그대로
{ "itemId": 69655504, "title": "…", "author": "…", "isbn": "9791162540640", "publisher": "…",
  "publishedDate": "2019-02-26", "coverUrl": "…", "description": "…", "totalPages": 360 }

// 직접 입력: itemId 없이
{ "title": "우리동네 이야기", "author": "홍길동", "totalPages": 120 }
```

응답 201: 아래 `BookResponse`

### BookResponse (등록·목록·상세 공통)

```json
{
  "id": 1,
  "itemId": 69655504,
  "title": "아주 작은 습관의 힘",
  "author": "제임스 클리어 저/이한이 역",
  "isbn": "9791162540640",
  "publisher": "비즈니스북스",
  "publishedDate": "2019-02-26",
  "coverUrl": "…",
  "description": "…",
  "totalPages": 360,
  "currentReading": {
    "recordId": 10,
    "round": 1,
    "status": "IN_PROGRESS",
    "currentPage": 120,
    "progressRate": 33
  }
}
```

- `id`가 `bookId`다.
- `currentReading`은 **가장 최근 회차** 요약. 기록이 없으면 `null`. `recordId`가 `readingRecordId`다.

### GET /api/books

최근 등록순. `?status=NOT_STARTED|IN_PROGRESS|COMPLETED`를 주면 최근 회차 상태로 거른다. 잘못된 값이면 400. 책이 없으면 `[]`.

### GET /api/books/{bookId} · DELETE /api/books/{bookId}

남의 책이면 404 (존재 여부를 숨긴다). 삭제는 인증 → 세션 → 기록 → 책 순서로 지우고 204.

## 독서 기록

### POST /api/books/{bookId}/reading-records

새 회차를 시작한다 (다회독). 끝나지 않은 회차가 있으면 409. 본문은 전부 선택이며 생략 가능.

```json
{ "currentPage": 0, "goalDate": "2026-11-30", "goalPage": 20, "memo": "하루 20쪽씩", "isPublic": false }
```

### ReadingRecordResponse (기록 API 공통)

```json
{
  "id": 10,
  "bookId": 1,
  "round": 1,
  "status": "IN_PROGRESS",
  "currentPage": 120,
  "totalPages": 360,
  "progressRate": 33,
  "goalDate": "2026-11-30",
  "goalPage": 20,
  "memo": "하루 20쪽씩",
  "isPublic": false,
  "startedAt": "2026-11-20T21:00:00",
  "completedAt": null
}
```

### PATCH /api/reading-records/{id}

보낸 필드만 바뀐다 (`null`은 그대로). `currentPage`가 전체 쪽수와 같아지면 자동 완독.

```json
{ "currentPage": 120 }
```

### POST /api/reading-records/{id}/complete

`COMPLETED`로 바꾸고 `completedAt`을 기록한다. 이미 완독이면 그대로. **보상은 지급하지 않는다** (보상은 세션 단위 → [reward/api.md](../reward/api.md)).

## 독서 세션

### POST /api/reading-sessions

독서 종료 화면에서 저장한다. `bookId`로 **지금 읽는 회차**를 찾아 세션을 붙이고 현재 페이지를 갱신한다 ([rules.md](./rules.md#3-독서-세션)).

```json
// 요청
{
  "bookId": 1,
  "readingTime": 1540,
  "startPage": 108,
  "endPage": 120,
  "sentence": "사람은 책을 만들고, 책은 사람을 만든다.",
  "photos": [{ "uri": "file:///…" }],
  "photoVerificationId": 12
}
```

| 필드 | 필수 | 설명 |
|---|---|---|
| `bookId` | ✅ | 서재 책 번호 |
| `readingTime` | ✅ | 독서 시간(초), 3분~2시간 |
| `startPage`, `endPage` | ✅ | 이번에 읽은 범위 |
| `sentence` | | 인상 깊은 문장. 이 세션의 회차 문장으로 **세션과 함께 저장**한다 (쪽 번호 = `endPage`, 1 미만이면 없음). 비어 있으면 저장하지 않는다. 500자 초과면 400 `VALIDATION_ERROR`(`fields[0].field`가 `sentence`)이고 세션도 저장되지 않는다. 앱은 문장 API를 따로 부르지 않는다 |
| `photos` | | ⏳ [TODO-2](../../known-issues.md#todo-2) 받기만 하고 저장하지 않음 |
| `photoVerificationId` | | 통과한 독서 인증 번호(`CertificationResponse.id`). 내 인증이고 `PASSED`이고 아직 다른 세션에 안 쓰였으면 **이 세션에 연결**한다 (사진 인증 보상 판단용). 조건이 안 맞으면 무시하고 저장은 성공 ([rules.md](./rules.md#5-독서-인증)) |

```json
// 응답 201
{
  "id": 42,
  "readingRecordId": 10,
  "bookId": 1,
  "readingTime": 1540,
  "startPage": 108,
  "endPage": 120,
  "startedAt": "2026-11-20T20:34:20",
  "endedAt": "2026-11-20T21:00:00",
  "status": "IN_PROGRESS",
  "currentPage": 120,
  "progressRate": 33
}
```

- `id`가 `readingSessionId`다. 이 값으로 독서 완료 보상(`POST /api/rewards/reading-sessions/{id}`)을 요청한다.
- `startedAt`·`endedAt`은 서버 시각 기준 (`endedAt` = 저장 요청 받은 시각, `startedAt` = `endedAt - readingTime`)
- `status`·`currentPage`·`progressRate`는 저장 후 회차 상태

- 세션·문장·인증 연결은 한 트랜잭션이다. 실패하면 아무것도 저장되지 않으므로 앱이 같은 요청을 다시 보내도 된다.

> ⚠️ [ISSUE-BUG-3](../../known-issues.md#issue-bug-3) — 서버는 저장했는데 응답만 끊긴 뒤 다시 보내면 세션이 2건이 된다.
>
> ⚠️ [ISSUE-LIMIT-1](../../known-issues.md#issue-limit-1) — `readingTime`은 앱이 보낸 값을 3분~2시간 범위로만 검증한다.

### GET /api/reading-records/{id}/sessions

회차의 세션 목록 (최근 먼저). 항목은 위 응답과 같은 모양. `status`·`currentPage`·`progressRate`는 **저장 당시가 아니라 회차의 현재 값**이다.

> ⚠️ [ISSUE-LIMIT-3](../../known-issues.md#issue-limit-3)

## 독서 인증

앱은 독서 종료 화면에서 사진을 붙이는 순간 **그 책의 가장 최근 회차**로 `image`만 보낸다 (쪽 범위·문장은 보내지 않음). `PASSED`만 통과로 보고, 통과 번호를 세션 저장 요청의 `photoVerificationId`로 보낸다. 앱은 최대 45초 기다린다.

### POST /api/reading-records/{id}/certifications

책 페이지 사진을 올리면 AI가 글자·쪽 번호·책 페이지 여부를 읽고, 서버 규칙으로 판정해 저장한다. `multipart/form-data`. 판정 규칙: [rules.md](./rules.md#5-독서-인증)

| 필드 | 필수 | 설명 |
|---|---|---|
| `image` | ✅ | 사진 파일 (JPEG·PNG·GIF·WEBP·HEIC, 최대 10MB) |
| `startPage`, `endPage` | | 이번에 읽은 범위. **둘 다 보내야** 쪽 번호를 비교한다 |
| `sentence` | | 인상 깊은 문장. 사진에 있는지만 알려주고 판정에는 영향 없음 |

### CertificationResponse (등록·목록 공통)

```json
{
  "id": 12,
  "readingRecordId": 5,
  "status": "PASSED",
  "bookPage": true,
  "detectedPage": 42,
  "sentenceFound": true,
  "messages": ["페이지 번호는 확인하지 못했어요."],
  "extractedText": "…",
  "createdAt": "2026-11-22T18:30:00"
}
```

| 필드 | 설명 |
|---|---|
| `status` | `PASSED` 통과 · `UNVERIFIED` 확인 불가 · `FAILED` 실패 |
| `bookPage` | AI가 책 페이지로 봤는지. 판단 못 하면 `null` |
| `detectedPage` | 사진에서 찾은 쪽 번호. 못 찾으면 `null` |
| `sentenceFound` | 문장을 찾았는지. 문장을 안 보냈거나 **목록 조회면 항상 `null`** |
| `messages` | 판정 이유·안내 문구. 화면에 그대로 보여줘도 된다. AI 사용 한도 초과(429)로 확인 없이 통과하면 "AI 확인 없이 통과했어요. (사용 한도 초과)" |
| `extractedText` | AI가 읽은 글자 |

### GET /api/reading-records/{id}/certifications

회차의 인증 목록 (최신 먼저). 남의 기록이면 404.

## 오늘·통계

### GET /api/me/reading-today

홈의 오늘 독서 기록. 사용자의 모든 책에서 오늘 날짜로 모은다.

```json
{ "readingMinutes": 42, "pagesRead": 30, "memoCount": 2 }
```

| 필드 | 설명 |
|---|---|
| `readingMinutes` | 오늘 세션 시간 합 (30초 단위 반올림한 분) |
| `pagesRead` | 오늘 세션의 (끝 페이지 − 시작 페이지) 합 |
| `memoCount` | 오늘 저장한 문장 수 (review 도메인의 `sentences`) |

### GET /api/me/reading-stats

독서 통계 화면.

```json
{
  "totalMinutes": 1260,
  "averageMinutes": 42,
  "completedBooks": 3,
  "totalPages": 980,
  "readingDays": 30,
  "goalBooks": 0,
  "goalTarget": 0,
  "weekly":  [{ "label": "월", "minutes": 30 }, "… 일까지 7개"],
  "monthly": [{ "label": "1주", "minutes": 120 }, "… 4주까지 4개"],
  "daily":   [{ "label": "06시", "minutes": 0 }, "… 21시까지 6개"]
}
```

| 필드 | 설명 |
|---|---|
| `totalMinutes` · `totalPages` | 전체 세션 합 |
| `readingDays` | 세션이 있는 날 수 |
| `averageMinutes` | `totalMinutes ÷ readingDays` |
| `completedBooks` | 완독 회차가 있는 책 수 |
| `goalBooks` · `goalTarget` | 항상 0 (미연결) ⏳ [TODO-12](../../known-issues.md#todo-12) |
| `weekly` | 이번 주 월~일 요일별 분 |
| `monthly` | 이번 달 1~4주 (4주차는 말일까지) |
| `daily` | 오늘, 시작 시각 기준 6구간 (05·08·11·14·17·20시부터) |

> ⚠️ [ISSUE-BUG-7](../../known-issues.md#issue-bug-7) — 앱의 카테고리별 독서 비율은 이 API에 없는 고정 예시 값

---

## 에러 코드

reading은 도메인 에러 코드 enum이 없다. HTTP 상태별 공통 코드로 나가고, 구분은 `message`로 한다 ([conventions/api.md](../../conventions/api.md#5-에러-코드-표)).

| HTTP | code | message 예 | 언제 |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | 검색어를 입력해주세요. | `query` 비어 있음 |
| 400 | `VALIDATION_ERROR` | 지원하지 않는 카테고리입니다 / 정렬입니다 | `category`·`sort` 값 오류 |
| 400 | `VALIDATION_ERROR` | 책 제목을 입력해주세요. / 전체 쪽수는 1 이상이어야 합니다. | 책 등록 |
| 400 | `VALIDATION_ERROR` | 현재 페이지는 0 이상 N 이하여야 합니다. | 페이지 범위 |
| 400 | `VALIDATION_ERROR` | 완독한 기록은 페이지를 수정할 수 없습니다. | 완독 회차 수정 |
| 400 | `VALIDATION_ERROR` | 독서 시간은 3분 이상이어야 합니다. / 최대 2시간입니다. | 세션 시간 |
| 400 | `VALIDATION_ERROR` | 종료 페이지는 전체 쪽수(N)를 넘을 수 없습니다. | 세션 페이지 |
| 400 | `VALIDATION_ERROR` | 메모는 200자 이하 / 하루 목표 페이지는 1 이상 | 기록 수정 |
| 400 | `VALIDATION_ERROR` | YES24_API_KEY 환경변수가 설정되지 않았습니다. | 서버 설정 누락 |
| 400 | `VALIDATION_ERROR` | 인증 사진을 올려주세요. / 이미지 파일만 올릴 수 있습니다. / 사진을 읽지 못했습니다. 다시 올려주세요. | 독서 인증 사진 |
| 404 | `NOT_FOUND` | 책을 찾을 수 없습니다: {bookId} | 없거나 남의 책 |
| 404 | `NOT_FOUND` | 독서 기록을 찾을 수 없습니다: {id} | 없거나 남의 기록 |
| 404 | `NOT_FOUND` | YES24에서 책을 찾을 수 없습니다: {itemId} | YES24에 없는 상품 |
| 409 | `CONFLICT` | 이미 서재에 있는 책입니다. | 같은 YES24 책 중복 등록 |
| 409 | `CONFLICT` | (진행 중인 회차 안내) / 이미 시작된 회차입니다. | 끝나지 않은 회차가 있는데 새 회차 |
| 409 | `CONFLICT` | (새 회차 안내) | 최근 회차가 완독인 책에 세션 저장 |
| 500 | `INTERNAL_ERROR` | 요청을 처리하지 못했습니다. | YES24 장애 등 (502로 따로 구분하지 않음) |
