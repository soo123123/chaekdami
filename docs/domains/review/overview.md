> 기준: feature/be3-review-delete (스펙 006) · 최종 확인: 2026-11-23 · 담당: BE3

# review — 독후활동

독서 중 **문장**을 모으고, 완독 후 **리뷰(별점·한줄평)** 와 **독후감**을 남기며, 같은 책을 완독한 사람끼리 **커뮤니티**에서 나누는 도메인.

## 핵심 개념

| 개념 | 단위 | 설명 | 자세히 |
|---|---|---|---|
| 문장 (sentence) | 회차 | 독서 중 저장하는 인상 깊은 문장. 완독 전에도 가능 | [rules.md](./rules.md#1-문장과-모음집) |
| 문장 모음집 | 회차 | 한 회차의 문장 모음. 공개 여부는 **회차의 `isPublic`** | [rules.md](./rules.md#1-문장과-모음집) |
| 리뷰 (review) | **책** | 별점(필수) + 한줄평(선택) + 스포일러·공개 여부. 책당 1개. 완독 후 작성 | [rules.md](./rules.md#2-리뷰별점한줄평) |
| 독후감 (book report) | **회차** | 완독 후 쓰는 긴 감상. 회차당 1개, 기본 비공개 | [rules.md](./rules.md#3-독후감) |
| 한줄평 목록·별점 통계 | ISBN | 같은 ISBN의 리뷰를 모아 보기. 완독 여부와 관계없이 조회 | [rules.md](./rules.md#4-한줄평-목록좋아요신고) |
| 좋아요·신고·블라인드 | 리뷰 | 신고가 쌓이면 자동 블라인드, 관리자가 해제 | [rules.md](./rules.md#4-한줄평-목록좋아요신고) |
| 완독자 커뮤니티 | ISBN | 같은 ISBN을 완독한 사람끼리 공개 모음집·독후감을 봄 | [rules.md](./rules.md#5-완독자-커뮤니티) |

> 옛 설계의 `quotes`·`ratings`·`one_line_reviews`·`reviews(독후감)`는 지금 `sentences`·`reviews(별점+한줄평)`·`book_reports`로 바뀌었다. → [decisions/0002](../../decisions/0002-review-merge-rating-oneline.md)

## 코드 위치

```
backend/src/main/java/com/chaekdami/review/
├── presentation/    SentenceController, ReviewController, BookReportController,
│                    CommunityController, ReviewAdminController, dto/
├── application/     SentenceService, SentenceCollectionService, ReviewService, ReadingReviewService,
│                    BookReportService, ReviewSocialService, CommunityService, ReviewAdminService,
│                    ReviewCleanupService, port/, event/, result/, command/
├── domain/          Sentence, Review, BookReport, ReviewLike, ReviewReport, ReportReason, ReviewErrorCode
└── infrastructure/  Repository, CommunityQueryRepository, JdbcBookReader, JdbcReadingRecordReader,
                     UserRepositoryNicknameReader, ReviewCleanupListener
```

프론트:
- FE1 커뮤니티: `features/fe1/api/communityApi.ts`, `CommunityScreen`
- FE2 독후감: `features/fe2/api/reviewApi.ts`, `ReviewWriteScreen` · `ReviewDetailScreen`
- 문장: `features/fe1/api/readingApi.ts` (독서 종료·책 상세)

## 다른 도메인과의 연결

| 방향 | 무엇 | 방식 |
|---|---|---|
| review → reading | 책(소유자·ISBN·쪽수), 회차(소유자·완독 여부) 조회 | port `BookReader`, `ReadingRecordReader` + JDBC 구현 |
| review → user | 작성자 닉네임 | `UserNicknameReader` |
| review → user | 현재 사용자 | `user.application.CurrentUser` |
| user → review | 회원 탈퇴 시 독후활동 삭제 | 이벤트 `UserWithdrawnEvent` → `ReviewCleanupListener` |
| reading → review | 책 삭제 시 독후활동 삭제 | reading port `BookActivityCleaner` → `ReviewBookActivityCleaner` → `ReviewCleanupService.deleteAllOfBook` (책 삭제와 같은 트랜잭션) |
| reading → review | 세션 저장 시 문장 저장 | reading port `SessionSentenceRecorder` → `SentenceServiceSessionSentenceRecorder` → `SentenceService.recordFromSession` (세션 저장과 같은 트랜잭션) |
| review → (없음) | `ReviewCreatedEvent`, `SentenceCreatedEvent`, `BookReport*Event` 발행 | 받는 곳 없음 (보상 연동용으로 남겨 둠) ⏳ [TODO-14](../../known-issues.md#todo-14) |

## 현재 상태

- ✅ 문장 CRUD·모음집, 리뷰(삭제 포함, 스펙 006), 독후감, 독후활동 통합 저장, 한줄평 목록·별점 통계, 좋아요·신고·블라인드, 커뮤니티, 관리자
- ✅ 세션 저장 때 문장 저장, 책 삭제 시 독후활동 정리 (스펙 003)
- ⏳ [TODO-4](../../known-issues.md#todo-4) AI 독후감 피드백 — `book_reports.revision`만 준비
- ⏳ [TODO-13](../../known-issues.md#todo-13) 커뮤니티·모음집·독후감 개별·관리자 API를 앱이 아직 부르지 않음
