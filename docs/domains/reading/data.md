> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# reading 데이터

테이블은 JPA 엔티티로 생성된다 (`ddl-auto=update`, 마이그레이션 파일 없음). 세 테이블은 `BaseTimeEntity`를 쓰지 않는다.

## 관계

```mermaid
erDiagram
  users ||--o{ books : "개인 서재"
  books ||--o{ reading_records : "회차 (다회독)"
  reading_records ||--o{ reading_sessions : "타이머 세션"
```

| 관계 | 설명 |
|---|---|
| users 1 : N books | 같은 책도 사용자마다 별도 행. 서로의 서재는 보이지 않는다 |
| books 1 : N reading_records | 완독한 책을 다시 읽으면 기존 기록을 덮지 않고 새 회차를 만든다 |
| reading_records 1 : N reading_sessions | 회차 동안 타이머를 켤 때마다 쌓인다. 총 독서 시간 = 세션 합 |

`reading_records.user_id`·`reading_sessions.user_id`는 조회 편의용으로 함께 저장한다 (항상 책 주인과 같다).

## books

엔티티: `Book`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | bigint | PK | `bookId` |
| user_id | bigint | not null | 서재 주인 |
| item_id | bigint | | YES24 상품 번호. 직접 입력한 책은 `null` |
| title | varchar | not null | |
| author | varchar | | YES24 형식 그대로 (예: "제임스 클리어 저/이한이 역") |
| isbn | varchar | | 13자리, 하이픈·공백 제거. 없으면 `null` |
| publisher | varchar | | |
| published_date | varchar | | `YYYY-MM-DD` |
| cover_url | varchar | | |
| description | text | | |
| total_pages | int | not null | 1 이상. 독서율 기준 |

UNIQUE `uk_books_user_id_item_id` (user_id, item_id) — 같은 YES24 책 중복 등록 방지. `item_id`가 `null`인 직접 입력 책은 제한하지 않는다.

## reading_records

엔티티: `ReadingRecord`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | bigint | PK | `readingRecordId` |
| user_id | bigint | not null, INDEX `idx_reading_records_user_id` | |
| book_id | bigint | FK → books | |
| round | int | not null | 회차 1, 2, … |
| status | varchar(20) | not null | `NOT_STARTED` · `IN_PROGRESS` · `COMPLETED` |
| current_page | int | not null | |
| goal_date | date | | 목표 완독 날짜 |
| goal_page | int | | 하루 목표 페이지 |
| memo | varchar(200) | | |
| is_public | boolean | not null | 이 회차의 **문장 모음집** 공개 여부. 기본 비공개 ([review/rules.md](../review/rules.md#1-문장과-모음집)) |
| started_at | timestamp | | 처음 페이지를 넘긴 시각 |
| completed_at | timestamp | | |
| created_at | timestamp | not null | |
| updated_at | timestamp | | |

UNIQUE `uk_reading_records_book_id_round` (book_id, round)

## reading_sessions

엔티티: `ReadingSession`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | bigint | PK | `readingSessionId` |
| user_id | bigint | not null | |
| reading_record_id | bigint | FK → reading_records | |
| started_at | timestamp | not null | `ended_at − duration_seconds` |
| ended_at | timestamp | not null | 서버가 저장 요청을 받은 시각 |
| duration_seconds | int | not null | 3분~2시간 |
| start_page | int | not null | |
| end_page | int | not null | |
| created_at | timestamp | not null | |

INDEX `idx_reading_sessions_reading_record_id`, `idx_reading_sessions_user_id_started_at` (오늘·이번 주 통계용)

## 삭제

| 상황 | 처리 | 상태 |
|---|---|---|
| 책 삭제 | 세션 → 기록 → 책 순서로 삭제 (`BookService.deleteBook`) | ✅ |
| 책 삭제 시 문장·리뷰·독후감·좋아요·신고 | 지우지 않음 | ⚠️ [ISSUE-DATA-1](../../known-issues.md#issue-data-1) |
| 책 삭제 시 보상 내역 | 지우지 않음 | ⚠️ [ISSUE-DATA-3](../../known-issues.md#issue-data-3) |
| 회원 탈퇴 | reading 데이터를 지우는 리스너 없음 | ⚠️ [ISSUE-DATA-2](../../known-issues.md#issue-data-2) |

## 변경 이력

| 시점 | 변경 |
|---|---|
| be/feat/book-reading | `books`를 사용자별 개인 서재로 (`user_id`, `item_id`, UNIQUE 추가), `reading_records`·`reading_sessions` 추가 |
| fix/fe1 (작업 트리) | 세션 최소 시간 3분 검사 추가 (테이블 변경 없음) |
