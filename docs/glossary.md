> 기준: fix/fe1@ef397a6 + 스펙 013 · 최종 확인: 2026-11-25 · 담당: BE1

# 용어집

## 식별자 — 가장 많이 헷갈리는 것

책다듬이의 책은 **사용자별 개인 서재**다. 같은 책이라도 사용자마다 `bookId`가 다르다.

| 이름 | 정체 | 누가 발급 | 주로 쓰는 곳 | 주의 |
|---|---|---|---|---|
| `itemId` | YES24 상품 번호 (숫자) | YES24 | 검색 결과에서 책 고르기, 서재 중복 등록 방지 | 직접 입력한 책은 `null` |
| `isbn` | 국제 도서 번호 13자리 (하이픈 없음) | 출판사 | 여러 사용자의 리뷰를 같은 책으로 묶기 | 직접 입력한 책은 없을 수 있음 |
| `bookId` | 내 서재의 책 번호 | 서버 (`books.id`) | 서재 조회·삭제, 회차 시작, 세션 저장, 리뷰 작성 | 책 응답에서는 필드 이름이 `id` |
| `readingRecordId` | 한 책을 **한 번 읽는 회차** | 서버 (`reading_records.id`) | 페이지 갱신, 완독, 문장, 독후감, 커뮤니티 항목 | 기록 응답에서는 `id`. 다회독이면 책 하나에 여러 개 |
| `readingSessionId` | 타이머 **한 번** 읽은 기록 | 서버 (`reading_sessions.id`) | 독서 완료 보상 지급 | 세션 저장 응답의 `id`. `readingRecordId`와 다르다 |
| `userQuestId` | 오늘(일일)·이번 주(주간) 나에게 배정된 퀘스트 | 서버 (`user_quests.id`) | 퀘스트 목록 표시 | 퀘스트 정의 번호(`quests.id`)와 다르다 |
| `itemId` (상점) | 상점 상품 번호 | 서버 (`shop_items.id`) | 상품 구매 | 위의 YES24 `itemId`와 **이름만 같고 다른 값** |
| `reviewId` | 리뷰(평점·한줄평) 번호 | 서버 (`reviews.id`) | 리뷰 수정, 좋아요, 신고 | 책(`bookId`) 단위로 1개 |
| `bookReportId` | 독후감 번호 | 서버 (`book_reports.id`) | 독후감 조회·수정·삭제 | 회차(`readingRecordId`) 단위로 1개 |
| `sentenceId` | 문장 번호 | 서버 (`sentences.id`) | 문장 수정·삭제 | |

```
user ─1:N─ book(bookId) ─1:N─ reading_record(readingRecordId, round) ─1:N─ reading_session(readingSessionId)
                │                         ├─1:N─ sentence(sentenceId)
                │                         └─1:1─ book_report(bookReportId)
                └─1:1─ review(reviewId)  ※ 리뷰는 회차가 아니라 책 단위
```

## 상태 값

| 대상 | 값 | 뜻 | 코드 |
|---|---|---|---|
| 독서 기록 | `NOT_STARTED` · `IN_PROGRESS` · `COMPLETED` | 읽기 전 · 읽는 중 · 완독 | `ReadingStatus` |
| 퀘스트 | `IN_PROGRESS` · `COMPLETED` · `REWARDED` | 진행 중 · 달성 · 보상 지급됨 | `QuestStatus` |
| 퀘스트 종류 | `DAILY` · `WEEKLY` | 일일 · 주간 | `QuestType` |
| 상점 상품 | `SHIELD` · `EXPERIENCE_BOOSTER` | 방어권 · 경험치 부스터 | `ShopItemType` |
| D-day 달력 | `READ` · `PROTECTED` | 읽은 날 · 방어권으로 지킨 날 | `DdayRecordStatus` |
| 권한 | `USER` · `ADMIN` | 일반 사용자 · 관리자 | `Role` |
| 신고 사유 | `SPOILER` · `ABUSIVE` · `SPAM` · `INAPPROPRIATE` · `OTHER` | | `ReportReason` |

## 용어

| 용어 | 뜻 |
|---|---|
| 서재 | 사용자가 등록한 책 목록. 공용 도서 DB가 아니라 사용자별 |
| 회차 (round) | 같은 책을 몇 번째 읽는지. 1회독, 2회독 … |
| 다회독 | 완독한 책을 새 회차로 다시 읽는 것 |
| 세션 | 타이머를 켜고 끈 한 번의 독서. 독서 종료 화면에서 저장 |
| 독서율 (progressRate) | 현재 페이지 ÷ 전체 쪽수 × 100. 저장하지 않고 계산 |
| 문장 (sentence) | 독서 중 저장한 인상 깊은 문장. 옛 설계의 quote |
| 문장 모음집 | 한 회차의 문장을 모아 보는 화면·API |
| 리뷰 (review) | 책에 대한 **평점 + 한줄평**. 옛 설계의 rating·one_line_review를 합친 것 |
| 독후감 (book report) | 완독 후 쓰는 긴 감상. 옛 설계의 reviews 테이블 |
| 커뮤니티 | 같은 책(ISBN)을 완독한 사용자끼리 리뷰·문장을 보는 공간 |
| 블라인드 | 관리자가 신고된 리뷰를 숨긴 상태 |
| 재화 (currency) | 보상으로 받고 상점에서 쓰는 코인 |
| 경험치 (experience) | 독서로 쌓이는 값. 일정량이 차면 레벨업 |
| 부스터 | 일정 시간 동안 독서 경험치를 늘리는 상점 아이템 |
| 방어권 (shield) | 독서를 못 한 날 연속 기록이 끊기지 않게 막는 아이템 |
| 연속 독서 (streak, dday) | 하루도 빠지지 않고 읽은 날 수. D-day 달력으로 계산 |
| D-day 목표 | 사용자가 정한 목표 날짜와 목표 권수 |
| 독서 완료 보상 | 세션 저장 후 독서 완료 화면에서 받는 경험치·퀘스트·연속일 처리. 세션당 1번 |
| 독서 알림 | 앱이 휴대폰에 미리 예약하는 로컬 알림. 서버 푸시는 쓰지 않음 (reminder) |
| 미접속 알림 / 복귀 알림 | 앱을 열지 않은 지 2·4·6일째 / 8·14·30일째에 가는 알림. 날이 갈수록 감정이 커지는 단계별 문구 |
| 이른 아침·늦은 저녁 알림 | 주말 아침(09:00)과 연속 독서(21:30) 알림. 설정의 버튼 하나로 끈다 |
