> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# 문제 · 할 일 · 질문

이 프로젝트의 **문제점, 남은 일, 결정할 것을 모으는 유일한 목록**이다. 각 도메인 문서에는 해당 위치에 ID 한 줄만 적고 이 문서로 링크한다.

## 분류 기준

> **"지금 이 기능을 쓰면 잘못된 결과가 나오거나 위험한가?"**
> 그렇다 → ⚠️ **문제** · 아직 없어서 못 쓸 뿐이다 → ⏳ **할 일** · 무엇이 맞는지 사람이 정해야 한다 → ❓ **질문**

| 구분 | ID | 분류 |
|---|---|---|
| ⚠️ 문제 | `ISSUE-<분류>-N` | `SEC` 보안 · `BUG` 잘못 동작 · `DATA` 지워져야 할 데이터가 남음 · `LIMIT` 알고 있는 한계 |
| ⏳ 할 일 | `TODO-N` | 기능(없는 기능) · 개선(동작은 맞고 구조·품질 정리) |
| ❓ 질문 | `ASK-N` | 기획·정책 결정 |

- 분류는 발견한 사람(또는 AI)이 기준에 따라 먼저 정한다. 기준으로 판단이 안 되면 ❓ 질문으로 올린다. 팀원이 분류나 심각도를 바꾸면 그 판단이 우선이다.
- **심각도**: 높음(데이터 오류·보안) · 중간(기능이 기대와 다름) · 낮음(불편·한계). AI는 "높음"을 기록하면 바로 사람에게 알린다.
- **상태**: 열림 → 진행 중(스펙 번호) → 해결. 해결되면 4장으로 옮기고 도메인 문서의 표시 줄을 지운다.
- ID는 한 번 붙이면 바꾸거나 재사용하지 않는다.
- 찾기: 문제 `grep -rn "ISSUE-" docs/` · 할 일 `grep -rn "TODO-" docs/` · 질문 `grep -rn "ASK-" docs/`

---

## 1. ⚠️ 문제

| ID | 심각도 | 상태 | 지금 구현 | 문제 | 위치 | 문서 | 스펙 |
|---|---|---|---|---|---|---|---|
| <a id="issue-sec-1"></a>ISSUE-SEC-1 | 높음 | 열림 | 메일 비밀번호가 `application-dev.properties`에 평문으로 있고 git에 커밋돼 있다 | 저장소를 볼 수 있는 누구나 메일 계정을 쓸 수 있다 | `backend/src/main/resources/application-dev.properties` | [user/overview](./domains/user/overview.md#현재-상태) | — |
| <a id="issue-sec-2"></a>ISSUE-SEC-2 | 높음 | 열림 | 팀 노션 "환경 변수 모음"에 YES24·Gemini·메일·DB 값이 평문으로 있다 | 노션 공유 범위만큼 비밀값이 노출된다 | 노션 dev 페이지 | [conventions/testing](./conventions/testing.md#2-환경변수) | — |
| <a id="issue-bug-1"></a>ISSUE-BUG-1 | 높음 | 열림 | 독서 종료 저장은 앱이 ① 세션 저장 → ② 문장 저장을 차례로 부른다. ②가 실패하면 저장 전체를 실패로 보여준다 | "다시 시도하기"를 누르면 ①부터 다시 보내 **같은 독서가 세션 2건**이 된다. 보상도 세션마다 받을 수 있다 | 앱 `useReadingEnd.saveReadingRecord` → `readingApi.saveReadingRecord` | [reading/api](./domains/reading/api.md#post-apireading-sessions) | 003 |
| <a id="issue-bug-2"></a>ISSUE-BUG-2 | 중간 | 열림 | 세션과 문장이 서로 다른 요청으로 저장된다. 서버의 세션 요청 `sentence` 필드와 `SentenceService.recordFromSession`은 쓰이지 않는다 | 세션만 저장되고 문장이 빠질 수 있다 | `ReadingSessionService.create`, 앱 `readingApi.ts` | [reading/api](./domains/reading/api.md#post-apireading-sessions), [review/rules](./domains/review/rules.md#1-문장과-모음집) | 003 |
| <a id="issue-data-1"></a>ISSUE-DATA-1 | 중간 | 열림 | 책 삭제는 세션 → 기록 → 책만 지운다. `ReviewCleanupService.deleteAllOfBook`은 있지만 호출되지 않는다 | 지운 책의 문장·리뷰·독후감·좋아요·신고가 남고, 리뷰는 ISBN 한줄평 목록에 계속 보인다 | `BookService.deleteBook` | [reading/data](./domains/reading/data.md#삭제), [review/data](./domains/review/data.md#삭제) | 003 |
| <a id="issue-data-2"></a>ISSUE-DATA-2 | 중간 | 열림 | 회원 탈퇴 시 review·reward·dday 리스너만 데이터를 지운다 | 탈퇴한 사용자의 서재·독서 기록·세션이 남는다 | `UserWithdrawnEvent` (reading 리스너 없음) | [reading/data](./domains/reading/data.md#삭제), [user/rules](./domains/user/rules.md#5-회원-탈퇴) | 003 |
| <a id="issue-data-3"></a>ISSUE-DATA-3 | 낮음 | 열림 | 책 삭제 시 보상 데이터는 그대로 둔다 | `reading_session_rewards`·`reward_transactions`가 지워진 세션 번호를 가리킨 채 남는다 (받은 경험치·재화는 유지) | `BookService.deleteBook` | [reward/data](./domains/reward/data.md#삭제) | ASK-4 |
| <a id="issue-limit-1"></a>ISSUE-LIMIT-1 | 중간 | 열림 | 서버는 독서 시간이 3분~2시간인지만 검증한다 | 사용자가 종료 화면에서 독서 시간을 늘려 입력할 수 있다 | `ReadingSession.of` | [reading/rules](./domains/reading/rules.md#3-독서-세션) | — |
| <a id="issue-limit-2"></a>ISSUE-LIMIT-2 | 낮음 | 열림 | 타이머는 앱 메모리에서 돈다 | 독서 중 앱이 완전히 종료되면 측정 시간이 사라진다 | 앱 `useReadingTimer` | [reading/rules](./domains/reading/rules.md#3-독서-세션) | — |
| <a id="issue-limit-3"></a>ISSUE-LIMIT-3 | 낮음 | 열림 | 세션 목록 응답의 `status`·`currentPage`·`progressRate`는 회차에서 읽는다 | 저장 당시 값이 아니라 회차의 현재 값이 나온다 | `ReadingSessionResponse` | [reading/api](./domains/reading/api.md#get-apireading-recordsidsessions) | — |

## 2. ⏳ 할 일

### 기능

| ID | 할 일 | 지금 상태 | 위치 | 문서 |
|---|---|---|---|---|
| <a id="todo-1"></a>TODO-1 | 독서 인증 사진 | 앱은 `POST /api/reading-photos/verify`를 부르지만 백엔드에 없음 → Mock (`PHOTO_VERIFY_USE_MOCK = true`). 업로드·판정 방식 미정. contract-check의 유일한 불일치 | 앱 `photoVerifyApi.ts` | [reading/overview](./domains/reading/overview.md#현재-상태) |
| <a id="todo-2"></a>TODO-2 | 세션 요청의 사진 연결 | `photos` 저장 안 함, 앱이 보내는 `photoVerificationId`는 서버 DTO에 칸이 없어 무시 | `CreateReadingSessionRequest` | [reading/api](./domains/reading/api.md#post-apireading-sessions) |
| <a id="todo-3"></a>TODO-3 | 사진 인증 추가 보상 연결 | 지급 로직은 있으나 인증 조회 임시 구현이 항상 false | `PendingPhotoCertificationChecker` | [reward/rules](./domains/reward/rules.md#2-경험치) |
| <a id="todo-4"></a>TODO-4 | AI 기능 (책 추천, 독후감 피드백, 문장 인증) | 없음. `book_reports.revision`만 준비 | — | [review/rules](./domains/review/rules.md#3-독후감) |
| <a id="todo-5"></a>TODO-5 | 주간 퀘스트 | `QuestType.WEEKLY` 값만 있음 | `QuestType` | [reward/rules](./domains/reward/rules.md#4-일일-퀘스트) |
| <a id="todo-6"></a>TODO-6 | 랭킹, 레벨 해금 | 없음 | — | [reward/rules](./domains/reward/rules.md#2-경험치) |
| <a id="todo-7"></a>TODO-7 | 서재 꾸미기 저장·구매 | 테마 3종이 기기에만 저장됨 | 앱 `themeStore` | [reading/overview](./domains/reading/overview.md#현재-상태) |
| <a id="todo-8"></a>TODO-8 | 푸시 알림 | 없음 | — | [overview](./overview.md#3-주요-기능과-현재-상태) |
| <a id="todo-9"></a>TODO-9 | 리뷰(별점) 삭제 | API 없음. 한줄평만 빈 문자열로 지움 | `ReviewController` | [review/rules](./domains/review/rules.md#2-리뷰별점한줄평) |
| <a id="todo-10"></a>TODO-10 | 관리자 사용자 관리 | 리뷰 블라인드만 있음 | — | [user/overview](./domains/user/overview.md#현재-상태) |
| <a id="todo-11"></a>TODO-11 | 바코드 스캔 검색 | 앱에 "준비 중" 안내 | 앱 `BookSearchScreen` | [reading/overview](./domains/reading/overview.md#현재-상태) |
| <a id="todo-12"></a>TODO-12 | 독서 통계 목표·D-day 완료 권수 연결 | 통계 `goalBooks`·`goalTarget` 항상 0, D-day 완료 권수는 사용자 입력 | `ReadingStatsService`, `DdayService` | [reading/api](./domains/reading/api.md#get-apimereading-stats), [dday/rules](./domains/dday/rules.md#1-목표) |
| <a id="todo-13"></a>TODO-13 | 앱에서 아직 안 쓰는 API 연결 | 완독, 독후감 개별, 커뮤니티 요약·항목, 문장 모음집, 관리자 API를 앱이 부르지 않음 (`contract-check.py --all`) | 앱 | [review/overview](./domains/review/overview.md#현재-상태) |
| <a id="todo-14"></a>TODO-14 | 독후활동 이벤트 받기 | `ReviewCreatedEvent` 등을 발행하지만 받는 곳 없음 (보상 연동용) | `review/application/event` | [review/overview](./domains/review/overview.md#다른-도메인과의-연결) |

### 개선

| ID | 할 일 | 지금 상태 | 위치 |
|---|---|---|---|
| <a id="todo-15"></a>TODO-15 | 에러 코드 방식 통일 | review는 이름, reward는 번호, reading은 HTTP 공통 코드 | [conventions/api](./conventions/api.md#5-에러-코드-표) |
| <a id="todo-16"></a>TODO-16 | `X-User-Id` 헤더 제거 | reading·reward·dday 컨트롤러가 헤더로 사용자를 받음 (필터가 토큰 사용자로 채움) | `JwtAuthenticationFilter` |
| <a id="todo-17"></a>TODO-17 | YES24 장애를 502로 | 지금은 500 `INTERNAL_ERROR` | `Yes24Client` |
| <a id="todo-18"></a>TODO-18 | DB 마이그레이션 도입 | `ddl-auto=update` — 컬럼 삭제·이름 변경이 반영되지 않음 | `application.properties` |
| <a id="todo-19"></a>TODO-19 | reward ↔ dday 직접 참조 정리 | 서로 직접 부름 | [architecture](./architecture.md#3-도메인끼리-연결) |
| <a id="todo-20"></a>TODO-20 | 프론트 ESLint 설정 | 설정 없음 | `frontend/` |
| <a id="todo-21"></a>TODO-21 | DB 없이 도는 컨텍스트 테스트 | `ChaekdamiApplicationTests.contextLoads`가 DB 비밀번호 없으면 실패 | `backend/src/test` |
| <a id="todo-22"></a>TODO-22 | 안 쓰는 메서드 정리 | `DdayService.markTodayRead` 호출 없음 | `DdayService` |

## 3. ❓ 질문

| ID | 질문 | 관련 |
|---|---|---|
| <a id="ask-1"></a>ASK-1 | 초기 기획의 "독서 시간: 상태 변경 5분"은 무슨 뜻인가? | [reading/rules](./domains/reading/rules.md#3-독서-세션) |
| <a id="ask-2"></a>ASK-2 | 세션 최대 2시간을 유지하나? | [reading/rules](./domains/reading/rules.md#3-독서-세션) |
| <a id="ask-3"></a>ASK-3 | 목록 페이지 번호를 통일하나? (review는 0부터, 도서 검색은 1부터) | [review/rules](./domains/review/rules.md#6-공통) |
| <a id="ask-4"></a>ASK-4 | 책을 삭제하면 보상 내역도 지우나? | ISSUE-DATA-3 |

## 4. 해결됨

| ID | 해결 | 날짜 | 스펙 |
|---|---|---|---|
| — | | | |
