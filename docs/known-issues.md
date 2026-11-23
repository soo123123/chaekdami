> 기준: feature/003-session-sentence (스펙 003) · 최종 확인: 2026-11-23 · 담당: BE1

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
- **담당**: 주 담당 파트(BE1·BE2·BE3·FE1·FE2·공통)를 먼저 쓰고, 함께 할 파트는 `(+FE1)`처럼 괄호로 붙인다. 파트 범위는 [architecture](./architecture.md)의 도메인 담당·파트 나눔을 따르고, 팀원이 바꾸면 그 판단이 우선이다.
- **기획 단계**: 할 일 앞에 `(확정)`(구현하기로 정함) 또는 `(아이디어)`(기획 단계, 우선순위 낮음)를 붙일 수 있다. 순서와 관계없이 병렬로 착수할 수 있다.
- **상태**: 열림 → 진행 중(스펙 번호) → 해결. 해결되면 4장으로 옮기고 도메인 문서의 표시 줄을 지운다.
- ID는 한 번 붙이면 바꾸거나 재사용하지 않는다.
- 찾기: 문제 `grep -rn "ISSUE-" docs/` · 할 일 `grep -rn "TODO-" docs/` · 질문 `grep -rn "ASK-" docs/`

---

## 1. ⚠️ 문제

| ID | 담당 | 심각도 | 상태 | 지금 구현 | 문제 | 위치 | 문서 | 스펙 |
|---|---|---|---|---|---|---|---|---|
| <a id="issue-sec-1"></a>ISSUE-SEC-1 | BE3 | 높음 | 열림 | 메일 비밀번호가 `application-dev.properties`에 평문으로 있고 git에 커밋돼 있다 | 저장소를 볼 수 있는 누구나 메일 계정을 쓸 수 있다 | `backend/src/main/resources/application-dev.properties` | [user/overview](./domains/user/overview.md#현재-상태) | — |
| <a id="issue-sec-2"></a>ISSUE-SEC-2 | 공통 | 높음 | 열림 | 팀 노션 "환경 변수 모음"에 YES24·Gemini·메일·DB 값이 평문으로 있다 | 노션 공유 범위만큼 비밀값이 노출된다 | 노션 dev 페이지 | [conventions/testing](./conventions/testing.md#2-환경변수) | — |
| <a id="issue-bug-3"></a>ISSUE-BUG-3 | BE1 (+FE1) | 낮음 | 열림 | 독서 종료 저장(`POST /api/reading-sessions`)은 한 트랜잭션이지만, 같은 요청을 한 번만 처리하는 장치가 없다 | 서버는 저장했는데 응답만 끊겨(네트워크·시간 초과) 앱이 "다시 시도하기"를 누르면 같은 독서가 세션 2건이 된다 | `ReadingSessionService.create`, 앱 `useReadingEnd` | [reading/api](./domains/reading/api.md#post-apireading-sessions) | 003 범위 밖 |
| <a id="issue-bug-4"></a>ISSUE-BUG-4 | FE2 | 중간 | 열림 | 독서 완료 화면의 "독서 집중도"는 전달 경로가 없어 예시 값(94%, 집중 모드 사용)을 보여준다 | 실제와 관계없는 집중도가 사용자에게 보인다. 미팅(2026-11-23) 결정: 표시를 없앤다 | 앱 `useReadingComplete`(`EXAMPLE.focusPercent`), `ReadingResultCard` | [reward/overview](./domains/reward/overview.md#현재-상태) | 불필요 |
| <a id="issue-bug-5"></a>ISSUE-BUG-5 | FE2 | 중간 | 열림 | 로그인 화면이 안전 영역(SafeArea)을 처리하지 않는다 | 실제 기기에서 화면 맨 위가 카메라(노치) 영역에 가려 잘려 보인다 | 앱 `LoginScreen` | [user/overview](./domains/user/overview.md#현재-상태) | 불필요 |
| <a id="issue-bug-6"></a>ISSUE-BUG-6 | BE2 (+FE1) | 중간 | 열림 (원인 확인 필요) | 서버는 독서 구간 `[종료-독서시간, 종료)` 중 부스터와 겹친 시간 비율만큼만 2배로 계산한다 (`0979aa9`, 미팅에서 정한 수정 방향과 같음) | 테스트 환경에서 독서 시간이 부스터 시간(30분)보다 길면 부스터가 적용되지 않았다. 의심 원인: ① 테스트 빌드가 `0979aa9` 이전 ② 일시정지가 있으면 계산한 구간이 실제 독서 시각과 어긋남 ③ 완료 화면 표시 문제 | `RewardService.grantReadingExperience`, 앱 `useReadingTimer` | [reward/rules](./domains/reward/rules.md#3-경험치-부스터) | 불필요 (규칙 변경 없음) |
| <a id="issue-bug-7"></a>ISSUE-BUG-7 | FE2 (+BE1) | 중간 | 열림 | 독서 통계의 "카테고리별 독서 비율"은 앱에 고정된 예시 값(`GENRES`)이다 | 사용자 기록과 관계없는 비율이 보인다. 제거할지 실제 데이터로 바꿀지는 ASK-6 | 앱 `ReadingStatsScreen` | [reading/api](./domains/reading/api.md#get-apimereading-stats) | 실제 데이터로 바꾸면 필요 (통계 API 변경) |
| <a id="issue-data-3"></a>ISSUE-DATA-3 | BE1 (+BE2) | 낮음 | 열림 | 책 삭제 시 보상 데이터는 그대로 둔다 | `reading_session_rewards`·`reward_transactions`가 지워진 세션 번호를 가리킨 채 남는다 (받은 경험치·재화는 유지) | `BookService.deleteBook` | [reward/data](./domains/reward/data.md#삭제) | ASK-4 |
| <a id="issue-limit-1"></a>ISSUE-LIMIT-1 | BE1 | 중간 | 열림 | 서버는 독서 시간이 3분~2시간인지만 검증한다 | 사용자가 종료 화면에서 독서 시간을 늘려 입력할 수 있다 | `ReadingSession.of` | [reading/rules](./domains/reading/rules.md#3-독서-세션) | — |
| <a id="issue-limit-2"></a>ISSUE-LIMIT-2 | FE1 | 낮음 | 열림 | 타이머는 앱 메모리에서 돈다 | 독서 중 앱이 완전히 종료되면 측정 시간이 사라진다 | 앱 `useReadingTimer` | [reading/rules](./domains/reading/rules.md#3-독서-세션) | — |
| <a id="issue-limit-3"></a>ISSUE-LIMIT-3 | BE1 | 낮음 | 열림 | 세션 목록 응답의 `status`·`currentPage`·`progressRate`는 회차에서 읽는다 | 저장 당시 값이 아니라 회차의 현재 값이 나온다 | `ReadingSessionResponse` | [reading/api](./domains/reading/api.md#get-apireading-recordsidsessions) | — |

## 2. ⏳ 할 일

### 기능

| ID | 담당 | 할 일 | 지금 상태 | 위치 | 문서 |
|---|---|---|---|---|---|
| <a id="todo-2"></a>TODO-2 | BE1 | 세션 요청의 사진 저장 | `photos` 받기만 하고 저장 안 함 (사진 저장소 없음). `photoVerificationId`는 스펙 004에서 연결됨 | `CreateReadingSessionRequest` | [reading/api](./domains/reading/api.md#post-apireading-sessions) |
| <a id="todo-4"></a>TODO-4 | BE3 | AI 기능 (독후감 피드백, 문장 인증) | 없음. `book_reports.revision`만 준비. 책 추천은 TODO-27로 분리 | — | [review/rules](./domains/review/rules.md#3-독후감) |
| <a id="todo-5"></a>TODO-5 | BE2 (+FE2) | 주간 퀘스트 | `QuestType.WEEKLY` 값만 있음 | `QuestType` | [reward/rules](./domains/reward/rules.md#4-일일-퀘스트) |
| <a id="todo-6"></a>TODO-6 | BE2 (+FE1, BE1) | (확정) 주간 독서 랭킹, 레벨 해금 | 없음. 기획(2026-11-23): 전체 사용자 주간 독서 순위 화면을 새로 만들고 하단 탭에 랭킹 버튼 추가. 집계는 reading 세션을 port로 받음 | — | [reward/rules](./domains/reward/rules.md#2-경험치) |
| <a id="todo-7"></a>TODO-7 | FE1 (+BE2) | 서재 꾸미기 저장·구매 | 테마 3종이 기기에만 저장됨 | 앱 `themeStore` | [reading/overview](./domains/reading/overview.md#현재-상태) |
| <a id="todo-8"></a>TODO-8 | FE2 (+FE1) | (확정) 독서 알림 | 없음. 기획(2026-11-23): 오늘 독서하지 않았으면 특정 시간부터 자정까지 반복 알림 (듀오링고 방식), 마이페이지에서 설정. 구현 방식은 ASK-7 (서버 푸시면 +BE3·BE2) | — | [overview](./overview.md#3-주요-기능과-현재-상태) |
| <a id="todo-9"></a>TODO-9 | BE3 (+FE1) | 리뷰(별점) 삭제 | API 없음. 한줄평만 빈 문자열로 지움 | `ReviewController` | [review/rules](./domains/review/rules.md#2-리뷰별점한줄평) |
| <a id="todo-10"></a>TODO-10 | BE3 | 관리자 사용자 관리 | 리뷰 블라인드만 있음 | — | [user/overview](./domains/user/overview.md#현재-상태) |
| <a id="todo-11"></a>TODO-11 | FE1 | 바코드 스캔 검색 | 앱에 "준비 중" 안내 | 앱 `BookSearchScreen` | [reading/overview](./domains/reading/overview.md#현재-상태) |
| <a id="todo-12"></a>TODO-12 | BE1 (+BE2, FE2) | 독서 통계 목표·D-day 완료 권수 연결 | 통계 `goalBooks`·`goalTarget` 항상 0, D-day 완료 권수는 사용자 입력 | `ReadingStatsService`, `DdayService` | [reading/api](./domains/reading/api.md#get-apimereading-stats), [dday/rules](./domains/dday/rules.md#1-목표) |
| <a id="todo-13"></a>TODO-13 | FE1·FE2 (완독은 미정) | 앱에서 아직 안 쓰는 API 연결 | 완독, 독후감 개별, 커뮤니티 요약·항목, 문장 모음집, 관리자 API를 앱이 부르지 않음 (`contract-check.py --all`) | 앱 | [review/overview](./domains/review/overview.md#현재-상태) |
| <a id="todo-14"></a>TODO-14 | BE2 (+BE3) | 독후활동 이벤트 받기 | `ReviewCreatedEvent` 등을 발행하지만 받는 곳 없음 (보상 연동용) | `review/application/event` | [review/overview](./domains/review/overview.md#다른-도메인과의-연결) |
| <a id="todo-25"></a>TODO-25 | FE2 (+BE2) | (확정) 홈 "최근 읽은 책"을 보유 아이템 표시로 교체 | 기획만 있음. `GET /api/shop/items`의 `ownedQuantity`는 상품 행별 수량이라 종류별 합계 API가 필요하면 BE2와 협의. FE2 담당자와 대화하며 구현 | 앱 `HomeScreen` | [reward/api](./domains/reward/api.md#get-apishopitems) |
| <a id="todo-26"></a>TODO-26 | FE2 | (확정) 부스터 적용 중 남은 시간 표시 | 부스터를 쓴 뒤 확인할 방법이 없음. 기획: 원형 불꽃 모양, 모든 화면 최상단, 클릭·드래그로 이동. `GET /api/rewards`의 `expBuffExpiredAt`로 구현 가능 (백엔드 변경 없음) | 앱 루트 레이아웃 | [reward/api](./domains/reward/api.md#get-apirewards) |
| <a id="todo-27"></a>TODO-27 | BE1 (+FE1) | (확정) LLM 책 추천 | 없음. 기획: 내 서재 책 목록으로 LLM에 요청해 최대 3권 추천, 도서 검색 화면 최근 검색어 바로 아래 컴포넌트로 표시. 기존 Gemini 연동 재사용 검토 (TODO-23) | 앱 `BookSearchScreen` | [reading/overview](./domains/reading/overview.md#현재-상태) |
| <a id="todo-28"></a>TODO-28 | BE2 (+FE2 상점, FE1 서재) | (아이디어) 랜덤박스 | 없음. 상점에서 구매하면 확률로 피규어·트로피를 얻고 서재 상단에 배치. 확률은 ASK-8. TODO-7과 연결 | — | [reward/rules](./domains/reward/rules.md#5-상점) |
| <a id="todo-29"></a>TODO-29 | BE2 (+FE2) | (아이디어) 칭호 | 없음. 칭호 획득·착용, 숨은 조건을 달성하면 히든 칭호. 조건은 ASK-8. BE2 부담이 크면 BE3 담당 검토 | — | — |

### 개선

| ID | 담당 | 할 일 | 지금 상태 | 위치 |
|---|---|---|---|---|
| <a id="todo-15"></a>TODO-15 | 백엔드 공통 | 에러 코드 방식 통일 | review는 이름, reward는 번호, reading은 HTTP 공통 코드 | [conventions/api](./conventions/api.md#5-에러-코드-표) |
| <a id="todo-16"></a>TODO-16 | BE1·BE2·BE3 | `X-User-Id` 헤더 제거 | reading·reward·dday 컨트롤러가 헤더로 사용자를 받음 (필터가 토큰 사용자로 채움) | `JwtAuthenticationFilter` |
| <a id="todo-17"></a>TODO-17 | BE1 | YES24 장애를 502로 | 지금은 500 `INTERNAL_ERROR` | `Yes24Client` |
| <a id="todo-18"></a>TODO-18 | 백엔드 공통 | DB 마이그레이션 도입 | `ddl-auto=update` — 컬럼 삭제·이름 변경이 반영되지 않음 | `application.properties` |
| <a id="todo-19"></a>TODO-19 | BE2 | reward ↔ dday 직접 참조 정리 | 서로 직접 부름 | [architecture](./architecture.md#3-도메인끼리-연결) |
| <a id="todo-20"></a>TODO-20 | 프론트 공통 | 프론트 ESLint 설정 | 설정 없음 | `frontend/` |
| <a id="todo-21"></a>TODO-21 | 백엔드 공통 | DB 없이 도는 컨텍스트 테스트 | `ChaekdamiApplicationTests.contextLoads`가 DB 비밀번호 없으면 실패 | `backend/src/test` |
| <a id="todo-22"></a>TODO-22 | BE2 | 안 쓰는 메서드 정리 | `DdayService.markTodayRead` 호출 없음 | `DdayService` |
| <a id="todo-23"></a>TODO-23 | BE1 | 독서 인증 429 임시 규칙 되돌리기 | Gemini가 임시 API라 사용 한도 초과(429)면 `PASSED`(`ai_skipped`), 사진 인증 보상에서는 제외. 정식 AI API로 바꿀 때 둘 다 다시 정한다 | `GeminiRetryPolicy`, `CertificationVerifier`, `Certification.isRewardable` |
| <a id="todo-24"></a>TODO-24 | BE1 (+FE1) | AI 장애를 앱에 따로 알리기 | AI 장애(시간 초과·다시 시도 실패)도 글자 부족과 같은 `UNVERIFIED`로 와서 앱은 "다시 찍어주세요"만 보여준다 | `GeminiPageTextExtractor`, 앱 `useReadingEnd` |

## 3. ❓ 질문

| ID | 담당 | 질문 | 관련 |
|---|---|---|---|
| <a id="ask-1"></a>ASK-1 | BE1 · 기획 | 초기 기획의 "독서 시간: 상태 변경 5분"은 무슨 뜻인가? | [reading/rules](./domains/reading/rules.md#3-독서-세션) |
| <a id="ask-2"></a>ASK-2 | BE1 · 기획 | 세션 최대 2시간을 유지하나? | [reading/rules](./domains/reading/rules.md#3-독서-세션) |
| <a id="ask-3"></a>ASK-3 | BE1 · BE3 | 목록 페이지 번호를 통일하나? (review는 0부터, 도서 검색은 1부터) | [review/rules](./domains/review/rules.md#6-공통) |
| <a id="ask-4"></a>ASK-4 | BE1 · BE2 | 책을 삭제하면 보상 내역도 지우나? | ISSUE-DATA-3 |
| <a id="ask-6"></a>ASK-6 | FE2 · BE1 | 독서 통계의 카테고리 비율을 없애나, 실제 데이터로 바꾸나? (바꾸면 통계 API 변경 → 스펙) | ISSUE-BUG-7 |
| <a id="ask-7"></a>ASK-7 | FE2 · BE3 · 기획 | 독서 알림을 기기 로컬 알림으로 하나(독서 종료 때 예약 취소, 백엔드 없음), 서버 푸시로 하나(토큰 저장·스케줄러 필요)? 알림 시작 시각과 간격은? | TODO-8 |
| <a id="ask-8"></a>ASK-8 | BE2 · 기획 | 랜덤박스 확률표와 칭호·히든 칭호 획득 조건 | TODO-28, TODO-29 |

## 4. 해결됨

| ID | 해결 | 날짜 | 스펙 |
|---|---|---|---|
| TODO-1 독서 인증 앱 연결 | 앱이 `POST /api/reading-records/{id}/certifications`로 사진을 보냄 (가장 최근 회차, 45초). `PASSED`만 통과 | 2026-11-22 | [004](./specs/004-reading-certification-app/) |
| TODO-3 사진 인증 추가 보상 연결 | 세션 저장 때 인증을 세션에 연결하고 `CertificationPhotoChecker`가 조회. 429 통과는 제외 | 2026-11-22 | [004](./specs/004-reading-certification-app/) |
| ASK-5 독서 인증 판정 엄격도 | `UNVERIFIED`는 통과 아님(다시 찍기, 보상 없음). 앱은 쪽 범위를 보내지 않아 쪽 번호 비교 안 함(±3쪽 규칙은 범위를 보내는 호출에만). 앱 대기 45초, 서버 AI 호출은 한 번 다시 시도 | 2026-11-22 | [004](./specs/004-reading-certification-app/) |
| ISSUE-BUG-1 문장 저장 실패 후 재시도 시 세션 중복 | 세션·문장을 한 요청·한 트랜잭션으로 저장, 앱은 문장 API를 따로 부르지 않음 (응답만 끊긴 경우는 ISSUE-BUG-3) | 2026-11-22 | [003](./specs/003-session-sentence-and-cleanup/) |
| ISSUE-BUG-2 세션과 문장이 따로 저장됨 | 세션 저장이 port `SessionSentenceRecorder`로 `SentenceService.recordFromSession` 호출 (쪽 번호 = `endPage`) | 2026-11-22 | [003](./specs/003-session-sentence-and-cleanup/) |
| ISSUE-DATA-1 책 삭제 시 독후활동 남음 | 책 삭제가 port `BookActivityCleaner`로 `ReviewCleanupService.deleteAllOfBook` 호출 (같은 트랜잭션) | 2026-11-22 | [003](./specs/003-session-sentence-and-cleanup/) |
| ISSUE-DATA-2 탈퇴 시 reading 데이터 남음 | `ReadingCleanupListener`가 인증·세션·기록·책 삭제 (탈퇴와 같은 트랜잭션) | 2026-11-22 | [003](./specs/003-session-sentence-and-cleanup/) |
