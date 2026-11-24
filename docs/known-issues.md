> 기준: main (이 문서는 main에서만 고친다) · 최종 확인: 2026-11-24 · 담당: BE1

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
- **비고** (문제·할 일 표의 마지막 칸): 실기기 검토·피드백 제공자처럼 담당은 아니지만 알아둘 것을 적는다. 예: `실기기 검토·피드백: FE1`. 적을 것이 없으면 칸을 생략해도 된다.
- **기획 단계**: 할 일 앞에 `(확정)`(구현하기로 정함) 또는 `(아이디어)`(기획 단계, 우선순위 낮음)를 붙일 수 있다. 순서와 관계없이 병렬로 착수할 수 있다.
- **상태** (문제·할 일 표의 `상태` 칸): 열림 → 진행 중(스펙 번호) → 해결. 할 일 표의 `지금 구현` 칸은 진행 단계가 아니라 지금 코드가 어떤지를 적는다. 해결은 고친 코드가 main에 병합된 뒤에 처리한다. 해결되면 4장으로 옮기고 도메인 문서의 표시 줄을 지운다.
- ID는 한 번 붙이면 바꾸거나 재사용하지 않는다.
- 찾기: 문제 `grep -rn "ISSUE-" docs/` · 할 일 `grep -rn "TODO-" docs/` · 질문 `grep -rn "ASK-" docs/`
- **고치는 법**: 이 문서는 main에서만 고치고 바로 main에 올린다. 브랜치의 사본은 오래됐을 수 있다. `python3 scripts/harness/known-issues.py show`(읽기) · `open` → 수정 → `push -m "docs: 요약"` ([conventions/git](./conventions/git.md))

---

## 🚧 진행 중 작업 — 건드리는 곳

지금 누가 어떤 파일을 고치고 있는지 미리 알려 충돌을 막는 표다.

- 스펙 **design이 승인되면** 그 스펙의 design ③ "수정할 파일"을 "건드리는 곳"에 적고 바로 push한다 (`known-issues.py paths --design <design.md>`가 칸 내용을 만들어 준다).
- 새 스펙의 design을 쓸 때와 구현을 시작하기 전에 `known-issues.py overlap --design <design.md>`로 겹치는 작업을 확인한다. 겹치면 두 담당자가 순서나 나눌 범위를 정한다.
- 구현 중 design이 바뀌면(S10) 이 칸도 고친다. PR이 main에 병합되면 행을 지운다.
- 스펙 없는 큰 작업(여러 파일 리팩터링 등)도 스펙 칸에 `-`를 쓰고 적을 수 있다.

| 스펙 | 대상 | 담당 | 브랜치 | 건드리는 곳 | 갱신 |
|---|---|---|---|---|---|
| 005 | TODO-6 | BE2 | feature/be2-ranking | `backend/.../reward/domain/RankingWeek.java`, `backend/.../reward/application/RankingService.java`, `backend/.../reward/application/WeeklyRankingResult.java`, `backend/.../reward/application/port/UserNicknameReader.java`, `backend/.../reward/application/port/WeeklyReadingTimeReader.java`, `backend/.../reward/infrastructure/RewardUserNicknameReader.java`, `backend/.../reward/infrastructure/ReadingSessionTimeReader.java`, `backend/.../reward/infrastructure/ReadingSessionTimeQueryRepository.java`, `backend/.../reward/infrastructure/RewardTransactionRepository.java`, `backend/.../reward/infrastructure/RewardAccountRepository.java`, `backend/.../reward/presentation/RankingController.java`, `backend/src/test/.../reward/domain/RankingWeekTest.java`, `backend/src/test/.../reward/application/RankingServiceTest.java` | 2026-11-23 |
| 008 | TODO-30 | FE1 | feature/008-ranking-screen | `frontend/src/constants/routes.ts`, `frontend/src/components/BottomTabBar.tsx`, `frontend/src/app/_layout.tsx`, `frontend/src/app/fe1/_layout.tsx`, `frontend/src/app/fe1/ranking.tsx`, `frontend/src/features/fe1/constants/routes.ts`, `frontend/src/features/fe1/constants/config.ts`, `frontend/src/features/fe1/types/ranking.ts`, `frontend/src/features/fe1/api/rankingApi.ts`, `frontend/src/features/fe1/api/devMockRankingApi.ts`, `frontend/src/features/fe1/hooks/ranking/useWeeklyRanking.ts`, `frontend/src/features/fe1/components/ranking/RankingTabs.tsx`, `frontend/src/features/fe1/components/ranking/RankingListItem.tsx`, `frontend/src/features/fe1/components/ranking/MyRankingBar.tsx`, `frontend/src/features/fe1/components/ranking/rankingImages.ts`, `frontend/src/features/fe1/screens/RankingScreen.tsx`, `frontend/src/features/fe1/assets/ranking/` | 2026-11-24 |
| `-` | ISSUE-BUG-26 | BE2 | fix/be2-photo-reward-tx | `backend/.../reward/application/ReadingSessionRewardService.java`, `backend/src/test/.../reward/application/ReadingSessionRewardServiceTest.java`, `backend/src/test/.../reward/application/ReadingSessionRewardTransactionTest.java`, `docs/domains/reward/rules.md` | 2026-11-24 |
| - | ISSUE-BUG-8 | BE3 | fix/be3-db-connection | `backend/src/main/java/com/chaekdami/user/application/UserService.java`, `backend/src/main/java/com/chaekdami/user/infrastructure/LoginCredential.java`, `backend/src/main/java/com/chaekdami/user/infrastructure/UserRepository.java`, `backend/src/main/java/com/chaekdami/user/infrastructure/PasswordResetTokenRepository.java`, `backend/src/main/java/com/chaekdami/reading/application/CertificationService.java`, `backend/src/main/resources/application.properties`, `docs/conventions/testing.md`, `docs/architecture.md`, `docs/domains/user/rules.md`, `docs/domains/reading/rules.md`, `backend/build.gradle`, `backend/src/test/java/com/chaekdami/user/application/`, `backend/src/test/java/com/chaekdami/connection/`, `backend/src/test/java/com/chaekdami/reward/infrastructure/CertificationPhotoCheckerTest.java` | 2026-11-24 |
| 009 | ISSUE-BUG-6 | BE2 (+FE2, FE1) | feature/009-booster-reading-time | `backend/.../reward/domain/UserBuff.java`, `backend/.../reward/infrastructure/UserBuffRepository.java`, `backend/.../reward/application/BoosterService.java`, `backend/.../reward/application/BoosterUseResult.java`, `backend/.../reward/application/RewardService.java`, `backend/.../reward/application/RewardStatusResult.java`, `backend/src/test/.../reward/domain/UserBuffTest.java`, `backend/src/test/.../reward/application/BoosterServiceTest.java`, `backend/src/test/.../reward/application/RewardServiceBoosterTest.java`, `frontend/src/features/fe2/api/rewardApi.ts`, `frontend/src/features/fe2/components/BoosterFloatingWidget.tsx`, `frontend/src/features/fe2/screens/ShopScreen.tsx`, `frontend/src/features/fe2/screens/RewardScreen.tsx`, `frontend/src/features/fe1/hooks/reading/useReadingTimer.ts` | 2026-11-24 |

---

## 1. ⚠️ 문제

| ID | 담당 | 심각도 | 상태 | 지금 구현 | 문제 | 위치 | 문서 | 스펙 | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| <a id="issue-sec-2"></a>ISSUE-SEC-2 | 공통 | 높음 | 열림 | 팀 노션 "환경 변수 모음"에 YES24·Gemini·메일·DB 값이 평문으로 있다 | 노션 공유 범위만큼 비밀값이 노출된다 | 노션 dev 페이지 | [conventions/testing](./conventions/testing.md#2-환경변수) | — |
| <a id="issue-sec-3"></a>ISSUE-SEC-3 | BE1 (+BE2) | 높음 | 열림 | 책 쪽수에 상한이 없고 세션끼리의 시간·구간 겹침을 확인하지 않는다 | 비정상적인 경험치 획득과 서버 부하가 가능하다. 주간 랭킹에도 영향 (자세한 내용은 담당자에게 따로 전달) | `BookService`, `ReadingSession`, `RewardAccount.addExperience` | — | — |
| <a id="issue-sec-4"></a>ISSUE-SEC-4 | BE3 | 중간 | 열림 | 가입에 이메일 확인이 없고 일부 요청 제한의 범위가 좁다 | 신고·별점 결과가 왜곡될 수 있다. 정책은 ASK-10 | `UserService`, `LoginAttemptLimiter`, `ReviewSocialService` | — | — |
| <a id="issue-bug-3"></a>ISSUE-BUG-3 | BE1 (+FE1) | 낮음 | 열림 | 독서 종료 저장(`POST /api/reading-sessions`)은 한 트랜잭션이지만, 같은 요청을 한 번만 처리하는 장치가 없다 | 서버는 저장했는데 응답만 끊겨(네트워크·시간 초과) 앱이 "다시 시도하기"를 누르면 같은 독서가 세션 2건이 된다 | `ReadingSessionService.create`, 앱 `useReadingEnd` | [reading/api](./domains/reading/api.md#post-apireading-sessions) | 003 범위 밖 |
| <a id="issue-bug-6"></a>ISSUE-BUG-6 | BE2 (+FE1) | 중간 | 진행 중 (스펙 009) | 서버는 독서 구간 `[종료-독서시간, 종료)` 중 부스터와 겹친 시간 비율만큼만 2배로 계산한다 (`0979aa9`, 미팅에서 정한 수정 방향과 같음) | 테스트 환경에서 독서 시간이 부스터 시간(30분)보다 길면 부스터가 적용되지 않았다. 의심 원인: ① 테스트 빌드가 `0979aa9` 이전 ② 일시정지가 있으면 계산한 구간이 실제 독서 시각과 어긋남 ③ 완료 화면 표시 문제 | `RewardService.grantReadingExperience`, 앱 `useReadingTimer` | [reward/rules](./domains/reward/rules.md#3-경험치-부스터) | 009 (부스터는 책 읽는 동안에만 시간이 흐르도록 규칙 변경) | 서버 구현 완료, 병합 대기 (feature/009-booster-reading-time). 앱 수정과 같은 때 병합, ISSUE-BUG-9 먼저 병합. FE2 응답 필드 확인·실제 DB 확인·재테스트 남음 |
| <a id="issue-bug-8"></a>ISSUE-BUG-8 | BE3 | 높음 | 진행 중 | 서버의 DB 연결이 3개인데 사진 인증은 AI 응답을 기다리는 동안 연결을 쥐고, 로그인·메일 발송도 연결을 오래 쓰거나 2개를 쓴다 | 동시 사용이 늘면 다른 API까지 기다리거나 500이 날 수 있다 | `CertificationService`, `LoginAttemptLimiter`, `UserService` | — | — |
| <a id="issue-bug-9"></a>ISSUE-BUG-9 | BE2 | 높음 | 진행 중 | 보상 조회가 계정 행을 잠그지 않고 읽은 뒤 연속 일수를 저장한다 (`@Version` 없음) | 구매·보상과 겹치면 재화·경험치가 옛값으로 돌아갈 수 있다 (확률 낮음). 부스터 위젯이 로그인 상태에서 화면 이동·앱 복귀·30초마다 조회해 겹칠 기회가 늘었다. 부스터 사용 직후에는 위젯과 상점이 거의 동시에 조회한다 (PR #23, 시뮬레이터 확인) | `RewardService.getRewardStatus`, 앱 `BoosterFloatingWidget`, `ShopScreen` | — | — | 구현 완료, 병합 대기 (fix/be2-reward-status). 실제 DB 동시 요청 미확인 |
| <a id="issue-bug-10"></a>ISSUE-BUG-10 | FE2 (+BE2) | 높음 | 진행 중 | D-day 조회가 실패하거나 응답 전이면 목표가 빈 목록인 채 추가할 수 있다 | 저장이 전체 교체라 기존 목표가 지워질 수 있다 | 앱 `DdayScreen`, `DdayService.saveGoals` | — | — |
| <a id="issue-bug-11"></a>ISSUE-BUG-11 | FE2 | 높음 | 진행 중 | 앱 시작 때 로그인 확인이 토큰 재발급 없이 `/api/me`를 부른다. 개발 빌드는 이 확인을 건너뛴다 | 출시용 앱은 Access Token(15분)이 만료된 뒤 다시 켜면 로그아웃된다 | 앱 `home.tsx`, `authApi.ts` | — | — |
| <a id="issue-bug-12"></a>ISSUE-BUG-12 | 프론트 공통 (FE2 주) | 높음 | 진행 중 | 재발급 실패 때 토큰만 지우고 로그인 화면으로 보내지 않는다. 네트워크 오류에도 토큰을 지운다. `/api/auth/` 요청은 재발급하지 않는다 | 일시 장애가 로그아웃이 되고, 세션이 끊긴 채 화면이 남는다. 비밀번호 변경 뒤도 같다 | 앱 `apiClient.ts`, `MyPageScreen` | — | — |
| <a id="issue-bug-13"></a>ISSUE-BUG-13 | FE2 | 중간 | 열림 | 조회 실패를 예시 값이나 기본값으로 보여준다 (마이페이지 닉네임, 홈 재화·레벨. 레벨·퀘스트·통계도 예시 값을 쓴다는 보고) | 내 기록이 아닌 값이 실제처럼 보인다 | 앱 `MyPageScreen`, `HomeScreen`, `RewardScreen`, `QuestScreen`, `ReadingStatsScreen` | — | — |
| <a id="issue-bug-14"></a>ISSUE-BUG-14 | FE2 (+FE1) | 중간 | 열림 | 독서 완료 화면의 목표 1시간 30분·60쪽이 고정 예시 값이다 | 모든 사용자에게 같은 목표가 보인다 | 앱 `useReadingComplete` | — | — |
| <a id="issue-bug-15"></a>ISSUE-BUG-15 | FE2 | 중간 | 열림 | 상점 구매 버튼에 요청 중 막는 처리가 없다 | 연타하면 중복 구매될 수 있다 | 앱 `ShopScreen` | — | — |
| <a id="issue-bug-16"></a>ISSUE-BUG-16 | FE2 (+BE2) | 중간 | 열림 | 레벨 화면의 레벨표(3~7)와 혜택이 고정 값이다 | 서버 레벨 규칙과 다르고, 없는 해금이 보인다 (해금은 TODO-6) | 앱 `RewardScreen`, `LevelPolicy` | — | — |
| <a id="issue-bug-17"></a>ISSUE-BUG-17 | FE2 (+BE1) | 중간 | 열림 | 통계에서 지난 날짜로 가면 빈 목록을 쓴다. 서버도 이번 기간만 준다는 보고 | 기록이 있어도 없다고 보인다 | 앱 `ReadingStatsScreen`, `ReadingStatsService` | — | — |
| <a id="issue-bug-18"></a>ISSUE-BUG-18 | FE2 | 중간 | 열림 | 상점에 "구매 화면 테스트용" 안내가 있다. D-day 등 다른 문구도 실제와 다르다는 보고 | 실제로는 재화가 차감된다 | 앱 `ShopScreen`, `DdayScreen` | — | — |
| <a id="issue-bug-19"></a>ISSUE-BUG-19 | FE1 | 중간 | 열림 | 독서 시작 화면의 오늘·이번 주 시간이 이 책의 세션만 합산한다 | 다른 책을 읽은 시간이 빠진다 | 앱 `readingApi.ts` | — | — |
| <a id="issue-bug-20"></a>ISSUE-BUG-20 | FE1 (+BE1) | 중간 | 열림 | 책 등록이 등록과 설정 저장 2번의 요청이다 | 두 번째가 실패하면 책은 남는데 실패로 보여, 다시 하면 중복되거나 409가 난다 | 앱 `readingApi.ts` `registerBook` | — | — |
| <a id="issue-bug-21"></a>ISSUE-BUG-21 | FE1 (+BE1) | 중간 | 열림 | 수동 등록에서 고른 표지 사진을 서버로 보내지 않는다 | 저장 뒤 표지가 없다 (세션 사진은 TODO-2) | 앱 `registerManualBook` | — | — |
| <a id="issue-bug-22"></a>ISSUE-BUG-22 | FE1 | 중간 | 열림 | 커뮤니티 더 불러오기 중 정렬이나 책을 바꾸면 로딩 상태가 풀리지 않는다 | 이후 한줄평을 더 불러오지 못한다 | 앱 `useBookReviews` | — | — |
| <a id="issue-bug-23"></a>ISSUE-BUG-23 | BE3 (+FE2) | 중간 | 진행 중 | 토큰 버전 확인 중의 모든 오류를 토큰 거절(401)로 처리한다 | DB 일시 오류가 로그아웃으로 이어질 수 있다 (ISSUE-BUG-12와 연결) | `JwtAuthenticationFilter` | — | — |
| <a id="issue-bug-24"></a>ISSUE-BUG-24 | BE1 (+FE1) | 중간 | 열림 | 사진 중복 확인이 세션에 쓰지 않은 인증까지 비교한다 | 통과한 사진을 지웠다 다시 붙이면 재사용으로 거절될 수 있다 (규칙 변경 필요) | `CertificationService`, `CertificationVerifier` | — | — |
| <a id="issue-bug-25"></a>ISSUE-BUG-25 | BE3 | 중간 | 열림 | 폐기된 Refresh Token이 오면 폐기 이유와 관계없이 모든 세션을 무효화한다 | 다른 기기의 옛 토큰 때문에 새 로그인까지 풀릴 수 있다 | `UserService.refresh` | — | — |
| <a id="issue-bug-26"></a>ISSUE-BUG-26 | BE2 (+BE1) | 중간 | 진행 중 | 사진 인증 조회 오류를 잡지만 같은 트랜잭션에 참여한다 | 기본 보상까지 취소될 수 있다. reward/rules와 다름 (실행 확인 필요) | `ReadingSessionRewardService`, `CertificationService` | — | — | 구현 완료, 병합 대기 (fix/be2-photo-reward-tx). 실제 DB 조회 오류 미확인 |
| <a id="issue-bug-27"></a>ISSUE-BUG-27 | BE1 | 낮음 | 열림 | 일간 통계는 0~4시를 마지막 칸(21시)에 더하고, 월간은 세션마다 분을 버린다 | 새벽 기록이 21시에 보이고 월간 합이 작게 나온다 | `ReadingStatsService` | — | — |
| <a id="issue-bug-28"></a>ISSUE-BUG-28 | BE1·BE3 | 낮음 | 진행 중 | 책 저장의 모든 무결성 오류를 "이미 서재에 있는 책입니다" 409로 바꾼다 | 너무 긴 입력도 중복으로 안내될 수 있다 (리뷰 ISBN 길이도 확인 필요) | `BookService` | — | — | BE3 리뷰 쪽 완료 (PR #29). BE1 `BookService`는 시작 전 |
| <a id="issue-bug-29"></a>ISSUE-BUG-29 | BE2 | 낮음 | 열림 | 보상 계정을 처음 만들 때 별도 트랜잭션(`REQUIRES_NEW`)을 열어 한 요청이 DB 연결을 2개 쓴다 | 처음 보상을 받는 요청이 동시에 몰리면 연결을 기다리다 500이 날 수 있다 (ISSUE-BUG-8에서 발견, 재현하지 않음) | `RewardAccountInitializer`, `RewardLedger` | — | — |
| <a id="issue-data-3"></a>ISSUE-DATA-3 | BE1 (+BE2) | 낮음 | 열림 | 책 삭제 시 보상 데이터는 그대로 둔다 | `reading_session_rewards`·`reward_transactions`가 지워진 세션 번호를 가리킨 채 남는다 (받은 경험치·재화는 유지) | `BookService.deleteBook` | [reward/data](./domains/reward/data.md#삭제) | ASK-4 |
| <a id="issue-data-4"></a>ISSUE-DATA-4 | 프론트 공통 | 중간 | 열림 | 로그아웃 때 토큰만 지운다. 서재 테마 저장에 사용자 구분이 없다 | 같은 기기의 다음 사용자에게 이전 테마 등이 남을 수 있다 (최근 검색어, 뒤로 가기 화면은 확인 필요) | 앱 `MyPageScreen`, `readingApi.ts` | — | — |
| <a id="issue-data-5"></a>ISSUE-DATA-5 | BE3 | 낮음 | 열림 | 로그인 제한 기록의 키에 이메일·IP를 쓰고 탈퇴 때 지우지 않는다 | 탈퇴한 사용자의 이메일·IP가 남는다 | `LoginAttemptLimiter`, `UserService.withdraw` | — | — |
| <a id="issue-limit-1"></a>ISSUE-LIMIT-1 | BE1 | 중간 | 열림 | 서버는 독서 시간이 3분~2시간인지만 검증한다 | 앱 종료 화면은 측정 시간 이내로 막지만, 측정값이 없을 때나 API를 직접 부를 때는 실제보다 긴 시간이 저장될 수 있다 (쪽수·겹치는 세션은 ISSUE-SEC-3) | `ReadingSession.of` | [reading/rules](./domains/reading/rules.md#3-독서-세션) | — |
| <a id="issue-limit-2"></a>ISSUE-LIMIT-2 | FE1 | 낮음 | 열림 | 타이머는 앱 메모리에서 돈다 | 독서 중 앱이 완전히 종료되면 측정 시간이 사라진다 | 앱 `useReadingTimer` | [reading/rules](./domains/reading/rules.md#3-독서-세션) | — |
| <a id="issue-limit-3"></a>ISSUE-LIMIT-3 | BE1 | 낮음 | 열림 | 세션 목록 응답의 `status`·`currentPage`·`progressRate`는 회차에서 읽는다 | 저장 당시 값이 아니라 회차의 현재 값이 나온다 | `ReadingSessionResponse` | [reading/api](./domains/reading/api.md#get-apireading-recordsidsessions) | — |
| <a id="issue-limit-4"></a>ISSUE-LIMIT-4 | FE2 (+FE1, BE2) | 높음 | 열림 | 독서 보상 요청은 독서 완료 화면에서만 보낸다 (스펙 001의 알려진 제한) | 실패한 채 나가거나 앱이 꺼지면 보상과 D-day 읽은 날을 놓친다. 서버 정산 기능 필요 | 앱 `useReadingComplete`, 서버 보상 | — | — |
| <a id="issue-limit-5"></a>ISSUE-LIMIT-5 | FE1 (+BE1) | 중간 | 열림 | 타이머와 저장 전 확인에 2시간 상한이 없다 | 2시간을 넘기면 저장할 때 서버가 거부한다. 상한 유지는 ASK-2 | 앱 `useReadingEnd`, `ReadingSession` | — | — |
| <a id="issue-limit-6"></a>ISSUE-LIMIT-6 | FE2 | 낮음 | 열림 | 부스터 위젯의 이동 범위가 하단 탭바와 화면 버튼을 계산하지 않는다 (PR #23의 안전 영역 제한도 노치·제스처 바만 뺀다) | 위젯을 옮긴 위치에 따라 하단 탭(홈 등)이나 서재 오른쪽 위 버튼을 가린다. 위젯을 다시 옮기면 누를 수 있다 (시뮬레이터 확인). 제안: 탭바가 있는 화면에서는 탭바 위까지만 이동. 서재 버튼 가림은 TODO-41과 함께 검토 | 앱 `BoosterFloatingWidget` | — | — | 실기기 검토·피드백: FE1 |

## 2. ⏳ 할 일

### 기능

| ID | 담당 | 할 일 | 상태 | 지금 구현 | 위치 | 문서 | 비고 |
|---|---|---|---|---|---|---|---|
| <a id="todo-2"></a>TODO-2 | BE1 | 세션 요청의 사진 저장 | 열림 | `photos` 받기만 하고 저장 안 함 (사진 저장소 없음). `photoVerificationId`는 스펙 004에서 연결됨 | `CreateReadingSessionRequest` | [reading/api](./domains/reading/api.md#post-apireading-sessions) |
| <a id="todo-4"></a>TODO-4 | BE1 | AI 기능 (독후감 피드백, 문장 인증) | 열림 | 없음. `book_reports.revision`만 준비. 책 추천은 TODO-27로 분리 | — | [review/rules](./domains/review/rules.md#3-독후감) |
| <a id="todo-5"></a>TODO-5 | BE2 (+FE2) | 주간 퀘스트 | 열림 | `QuestType.WEEKLY` 값만 있음 | `QuestType` | [reward/rules](./domains/reward/rules.md#4-일일-퀘스트) |
| <a id="todo-6"></a>TODO-6 | BE2 (+FE1, BE1) | (확정) 주간 독서 랭킹, 레벨 해금 | 진행 중 (스펙 005) | 없음 (main 기준. 서버 랭킹 API는 feature/be2-ranking에서 경험치·독서 시간 2개로 구현, 병합 전). 기획(2026-11-23): 전체 사용자 주간 독서 순위 화면을 새로 만들고 하단 탭에 랭킹 버튼 추가. 집계는 reading 세션을 port로 받음. 화면은 TODO-30으로 분리. 레벨 화면의 해금 혜택 표시는 ISSUE-BUG-16 | — | [reward/rules](./domains/reward/rules.md#2-경험치) | 랭킹 API 구현 완료, 병합 대기 (feature/be2-ranking). FE1 승인·실제 DB 확인 남음. 레벨 해금 미착수 |
| <a id="todo-7"></a>TODO-7 | FE1 (+BE2) | 서재 꾸미기 저장·구매 | 열림 | 테마 3종이 기기에만 저장됨 (사용자 구분도 없음, ISSUE-DATA-4) | 앱 `themeStore` | [reading/overview](./domains/reading/overview.md#현재-상태) |
| <a id="todo-8"></a>TODO-8 | BE3 | (확정) 독서 독려 알림 (기기 로컬, Android·iOS) | 열림 | 없음. 기획(2026-11-24, 2026-11-23의 자정까지 반복 알림을 대체): 시간대·요일, 금일 독서 여부, 금일·금주 독서량, 연속 독서, 미접속을 활용해 독서를 유도하는 알림 (듀오링고 방식). 앱이 7일치를 예약하고 독서 저장·접속 때 다시 예약, 마이페이지에서 설정. 서버는 알림용 상태 조회와 `reminder_settings`(주간 목표·마지막 접속·푸시 수신) 테이블. 독서 여부·독서량은 저장하지 않고 세션에서 계산. 세부 값은 ASK-7, 날짜 기준은 ASK-9. 서버 푸시는 TODO-42 | 앱 `MyPageScreen`, `useReadingEnd`, `app/_layout.tsx` | [overview](./overview.md#3-주요-기능과-현재-상태) | 담당은 BE3 단독이지만 FE1·FE2 화면 파일을 고침 |
| <a id="todo-11"></a>TODO-11 | FE1 | 바코드 스캔 검색 | 열림 | 앱에 "준비 중" 안내 | 앱 `BookSearchScreen` | [reading/overview](./domains/reading/overview.md#현재-상태) |
| <a id="todo-12"></a>TODO-12 | BE1 (+BE2, FE2) | 독서 통계 목표·D-day 완료 권수 연결 | 열림 | 통계 `goalBooks`·`goalTarget` 항상 0, D-day 완료 권수는 사용자 입력 | `ReadingStatsService`, `DdayService` | [reading/api](./domains/reading/api.md#get-apimereading-stats), [dday/rules](./domains/dday/rules.md#1-목표) |
| <a id="todo-13"></a>TODO-13 | FE1·FE2 (완독은 미정) | 앱에서 아직 안 쓰는 API 연결 | 열림 | 완독, 독후감 개별, 커뮤니티 요약·항목, 문장 모음집, 관리자 API, 리뷰 삭제(TODO-9에서 넘어옴, FE1)를 앱이 부르지 않음 (`contract-check.py --all`) | 앱 | [review/overview](./domains/review/overview.md#현재-상태) |
| <a id="todo-14"></a>TODO-14 | BE2 (+BE3) | 독후활동 이벤트 받기 | 열림 | `ReviewCreatedEvent` 등을 발행하지만 받는 곳 없음 (보상 연동용) | `review/application/event` | [review/overview](./domains/review/overview.md#다른-도메인과의-연결) |
| <a id="todo-27"></a>TODO-27 | BE1 (+FE1) | (확정) LLM 책 추천 | 열림 | 없음. 기획: 내 서재 책 목록으로 LLM에 요청해 최대 3권 추천, 도서 검색 화면 최근 검색어 바로 아래 컴포넌트로 표시. 기존 Gemini 연동 재사용 검토 (TODO-23) | 앱 `BookSearchScreen` | [reading/overview](./domains/reading/overview.md#현재-상태) |
| <a id="todo-28"></a>TODO-28 | BE2 (+FE2 상점, FE1 서재) | (아이디어) 랜덤박스 | 열림 | 없음. 상점에서 구매하면 확률로 피규어·트로피를 얻고 서재 상단에 배치. 확률은 ASK-8. TODO-7과 연결 | — | [reward/rules](./domains/reward/rules.md#5-상점) |
| <a id="todo-29"></a>TODO-29 | BE2 (+FE2) | (아이디어) 칭호 | 열림 | 없음. 칭호 획득·착용, 숨은 조건을 달성하면 히든 칭호. 조건은 ASK-8. BE2 부담이 크면 BE3 담당 검토 | — | — |
| <a id="todo-30"></a>TODO-30 | FE1 (+BE2) | (확정) 주간 랭킹 화면과 하단 탭 | 진행 중 (스펙 008) | 없음 (main 기준. feature/008-ranking-screen에서 개발용 예시 데이터로 구현, 병합 전). TODO-6에서 화면을 분리. 서버 API(스펙 005) 병합 후 예시 데이터를 끄고 연결, 실기기 확인 필요 | 앱 `RankingScreen`, `BottomTabBar` | [architecture](./architecture.md) |
| <a id="todo-31"></a>TODO-31 | FE2 | 완독 후 독후감 UI 개선 | 열림 | 노션 Notice에만 적혀 있던 항목. 개선할 내용은 정해지지 않음 | 앱 독후감 화면 | — |
| <a id="todo-32"></a>TODO-32 | FE1 (+BE1) | 독서 목표·공개 설정을 등록 뒤에도 보기·수정 | 열림 | 등록 화면에서만 입력. 새 회차에는 설정할 방법이 없다는 보고 | 앱 책 상세 | — |
| <a id="todo-33"></a>TODO-33 | FE1 | 도서 검색 결과 21번째 이후 보기 | 열림 | 1페이지 20권만 조회 | 앱 `readingApi.ts` | — |
| <a id="todo-34"></a>TODO-34 | BE3 (+FE2) | 닉네임 변경 API와 마이페이지 준비 중 항목 | 열림 | 서버에 닉네임 변경 서비스만 있고 API가 없음. 앱의 프로필 편집·설정·고객센터·약관은 준비 중 (알림은 TODO-8) | `NicknameChanger`, 앱 `MyPageScreen` | — |
| <a id="todo-35"></a>TODO-35 | BE3 (+FE1) | 공개 독후감·문장의 신고와 블라인드 | 열림 | 신고·블라인드는 한줄평 리뷰에만 있음. 정지 회원 글은 ASK-11 | `CommunityQueryRepository` | — |
| <a id="todo-40"></a>TODO-40 | FE2 | 부스터 사용 버튼을 상점에서 홈 보유 아이템으로 이동 | 열림 | 사용 버튼은 상점에만 있고, 홈 "나의 보유 아이템"은 개수만 보여준다. 보유 아이템을 보는 곳에서 바로 쓰는 것이 자연스러워, 홈 경험치병에 사용 버튼을 넣고 상점의 사용 버튼은 뺀다 (FE1 제안, FE2 확인 필요). 제안 기준: 상점의 적용 상태·보유 개수 표시는 유지, 사용 전 확인 창, 0개면 비활성, 방어권은 버튼 없음, 사용 후 홈 개수와 위젯 바로 갱신. 스펙 001 D10·R5.1(상점에 사용 버튼)과 달라진다. API 변경 없음 | 앱 `HomeScreen`, `ShopScreen` | [스펙 001](./specs/001-reward-integration/requirements.md) | 실기기 검토·피드백: FE1 |
| <a id="todo-41"></a>TODO-41 | FE2 | (아이디어) 부스터 위젯을 놓으면 가장자리로 자동 이동 | 열림 | 놓은 자리에 그대로 멈춰 화면 가운데에도 남는다. 화면 내용을 덜 가리도록, 손을 떼면 가까운 좌우 가장자리로 붙인다 (제안 기준: 세로 위치는 유지, 안전 영역 안). 하단 탭 가림(ISSUE-LIMIT-6)과 함께 검토 | 앱 `BoosterFloatingWidget` | — | 실기기 검토·피드백: FE1 |
| <a id="todo-42"></a>TODO-42 | BE3 | (확정) 미접속 사용자 복귀 푸시 (Android) | 열림 | 없음. 기획(2026-11-24): 로컬 예약(7일)이 끝난 뒤인 8일 이상 미접속 사용자에게만 서버 푸시를 보내 TODO-8과 겹치지 않게 함. Expo Push Service 사용(제안). `device_tokens`·`push_logs` 테이블, 토큰 등록·해제 API, 하루 한 번 스케줄러 필요. Apple 유료 개발자 계정이 없어 iOS 서버 푸시는 제외. Firebase·Expo projectId·개발 빌드 필요. TODO-8 다음에 진행 | `app.json`, 백엔드 새 도메인 | [overview](./overview.md#3-주요-기능과-현재-상태) |

### 개선

| ID | 담당 | 할 일 | 상태 | 지금 구현 | 위치 | 비고 |
|---|---|---|---|---|---|---|
| <a id="todo-15"></a>TODO-15 | 백엔드 공통 | 에러 코드 방식 통일 | 열림 | review는 이름, reward는 번호, reading은 HTTP 공통 코드 | [conventions/api](./conventions/api.md#5-에러-코드-표) |
| <a id="todo-16"></a>TODO-16 | BE1·BE2·BE3 | `X-User-Id` 헤더 제거 | 열림 | reading·reward·dday 컨트롤러가 헤더로 사용자를 받음 (필터가 토큰 사용자로 채움) | `JwtAuthenticationFilter` |
| <a id="todo-17"></a>TODO-17 | BE1 | YES24 장애를 502로 | 열림 | 지금은 500 `INTERNAL_ERROR`. 호출 시간 제한(연결·읽기) 설정도 없어 함께 추가 필요 | `Yes24Client` |
| <a id="todo-18"></a>TODO-18 | 백엔드 공통 | DB 마이그레이션 도입 | 열림 | `ddl-auto=update` — 컬럼 삭제·이름 변경이 반영되지 않음. enum 값 추가·변경 때 이미 있는 CHECK 제약(`*_check`)도 바뀌지 않아, 오래된 DB(Supabase·로컬)에서만 저장이 실패함 (SQLState 23514). 예: `TransactionReason.PHOTO_CERTIFICATION` 추가 뒤 사진 인증 세션 저장 시 `reward_transactions_reason_check` 위반 → 보상 트랜잭션 전체 롤백·500. 도입 전까지는 enum을 바꾸면 해당 DB 제약도 SQL로 함께 고침 (enum 칸 10개) | `application.properties`, `@Enumerated` 필드 |
| <a id="todo-19"></a>TODO-19 | BE2 | reward ↔ dday 직접 참조 정리 | 열림 | 서로 직접 부름 | [architecture](./architecture.md#3-도메인끼리-연결) |
| <a id="todo-20"></a>TODO-20 | 프론트 공통 | 프론트 ESLint 설정 | 열림 | 설정 없음 | `frontend/` |
| <a id="todo-21"></a>TODO-21 | 백엔드 공통 | DB 없이 도는 컨텍스트 테스트 | 열림 | `ChaekdamiApplicationTests.contextLoads`가 DB 비밀번호 없으면 실패 | `backend/src/test` |
| <a id="todo-22"></a>TODO-22 | BE2 | 안 쓰는 메서드 정리 | 열림 | `DdayService.markTodayRead` 호출 없음. 호출 없다는 보고(확인 필요): `RewardService.createAccount`, `ReviewLikeRepository.existsByReview_IdAndUserId`, `BookReportReader.find`(TODO-4 준비용). `ReadingRecordService`의 완독 이벤트 TODO 주석도 유지할지 결정 | `DdayService` |
| <a id="todo-23"></a>TODO-23 | BE1 | 독서 인증 429 임시 규칙 되돌리기 | 열림 | Gemini가 임시 API라 사용 한도 초과(429)면 `PASSED`(`ai_skipped`), 사진 인증 보상에서는 제외. 정식 AI API로 바꿀 때 둘 다 다시 정한다 | `GeminiRetryPolicy`, `CertificationVerifier`, `Certification.isRewardable` |
| <a id="todo-24"></a>TODO-24 | BE1 (+FE1) | AI 장애를 앱에 따로 알리기 | 열림 | AI 장애(시간 초과·다시 시도 실패)도 글자 부족과 같은 `UNVERIFIED`로 와서 앱은 "다시 찍어주세요"만 보여준다 | `GeminiPageTextExtractor`, 앱 `useReadingEnd` |
| <a id="todo-36"></a>TODO-36 | 공통 | 출시 준비 정리 | 열림 | 비밀번호 재설정 주소 기본값이 `localhost`, 앱이 사용자 정보를 console에 남김. 앱 이름·번들 ID와 템플릿 화면·파일 정리도 필요하다는 보고 | `application.properties`, 앱 `home.tsx`, `app.json` |
| <a id="todo-37"></a>TODO-37 | 공통 | main 보호와 자동 검사(CI), 작업 도구 정리 | 열림 | main 보호와 CI 없음. PR 없는 직접 push가 있었음. known-issues 예외를 먼저 정해야 함. Cursor 규칙에 push 규칙, issue-log 스킬에 노션 `완료일` 칸도 추가 | GitHub 설정, `.cursor/rules`, `.claude/skills` |
| <a id="todo-38"></a>TODO-38 | 백엔드 공통 | 핵심 로직 테스트 보강 | 열림 | 동시성·실제 트랜잭션 테스트가 없고 인증·통계·독서 기록 등 테스트가 없는 서비스가 있다는 보고 (TODO-21과 별개) | `backend/src/test` |
| <a id="todo-39"></a>TODO-39 | FE1·FE2·BE1·BE2·BE3 | 스펙 001·003·004 실기기 확인 | 열림 | 각 tasks에 4건·4건·6건 남음. 끝나면 스펙을 done으로 | [specs](./specs/README.md) |

## 3. ❓ 질문

| ID | 담당 | 질문 | 관련 |
|---|---|---|---|
| <a id="ask-1"></a>ASK-1 | BE1 · 기획 | 초기 기획의 "독서 시간: 상태 변경 5분"은 무슨 뜻인가? | [reading/rules](./domains/reading/rules.md#3-독서-세션) |
| <a id="ask-2"></a>ASK-2 | BE1 · 기획 | 세션 최대 2시간을 유지하나? (지금은 넘기면 저장할 때 거부됨, ISSUE-LIMIT-5) | [reading/rules](./domains/reading/rules.md#3-독서-세션) |
| <a id="ask-3"></a>ASK-3 | BE1 · BE3 | 목록 페이지 번호를 통일하나? (review는 0부터, 도서 검색은 1부터) | [review/rules](./domains/review/rules.md#6-공통) |
| <a id="ask-4"></a>ASK-4 | BE1 · BE2 | 책을 삭제하면 보상 내역도 지우나? | ISSUE-DATA-3 |
| <a id="ask-7"></a>ASK-7 | FE2 · BE3 · 기획 | 독서 알림의 세부 값. 방식은 로컬 알림과 서버 푸시를 함께 쓰기로 결정 (BE3, 2026-11-24). 남은 것: 주간 목표를 사용자가 정하나(제안: 기본 5시간)? 하루 최대 개수와 금지 시간(제안: 2개, 22시 30분~8시)? 알림 시각과 문구? 복귀 푸시 시점(제안: 8·14·30일째)? | TODO-8, TODO-42 |
| <a id="ask-8"></a>ASK-8 | BE2 · 기획 | 랜덤박스 확률표와 칭호·히든 칭호 획득 조건 | TODO-28, TODO-29 |
| <a id="ask-9"></a>ASK-9 | BE1·BE2·BE3 | 서버 날짜 기준을 한국 시간으로 통일하나? 자정을 넘긴 세션은 시작일·종료일 중 어느 날로 보나? (지금은 화면마다 다르고 서버 시간대 설정이 없다는 보고) 응답 시각에 시간대를 표기하나? (부스터 만료 시각 `expBuffExpiredAt`에 시간대가 없어 앱이 기기 시간대로 해석한다. 서버와 기기 시간대가 다르면 위젯 남은 시간이 틀릴 수 있다) | 스펙 005의 한국 시간 주 경계, 부스터 남은 시간 표시 |
| <a id="ask-10"></a>ASK-10 | BE3 · 기획 | 가입 때 이메일을 확인하나? | ISSUE-SEC-4 |
| <a id="ask-11"></a>ASK-11 | BE3 · 기획 | 정지된 회원의 글을 숨기나? | TODO-35, [007](./specs/007-admin-users/) |
| <a id="ask-12"></a>ASK-12 | FE1 · 기획 | 책 정보의 찜하기를 유지하나? (지금은 화면을 나가면 사라짐) | 앱 `BookInfoScreen` |

## 4. 해결됨

| ID | 해결 | 날짜 | 스펙 |
|---|---|---|---|
| TODO-9 리뷰(별점) 삭제 | `DELETE /api/reviews/{reviewId}` 추가 (PR 20). 앱 연결은 TODO-13 | 2026-11-24 | [006](./specs/006-review-delete/) |
| TODO-25 홈 보유 아이템 표시 | `HomeScreen`의 "최근 읽은 책"을 "나의 보유 아이템"으로 교체 (`44ff21d`). 완료는 FE2 확인 | 2026-11-24 | — |
| TODO-26 부스터 남은 시간 표시 | `BoosterFloatingWidget`을 최상위 레이아웃에 추가 — 드래그 이동, 남은 시간 (`44ff21d`). 사용 직후 갱신·안전 영역 제한 보완 (PR #23). 완료는 FE2 확인 | 2026-11-24 | — |
| ISSUE-BUG-7 독서 통계의 예시 카테고리 비율 | `ReadingStatsScreen`의 카테고리 비율과 `GENRES` 제거 (`44ff21d`). 완료는 FE2 확인 | 2026-11-24 | — |
| ASK-6 독서 통계 카테고리 비율 | 없애는 것으로 정리 (앱에서 제거됨, 통계 API 변경 없음) | 2026-11-24 | — |
| ISSUE-SEC-1 메일 비밀번호 평문 커밋 | `application-dev.properties`의 평문 줄을 지우고 `application.properties`의 `${MAIL_PASSWORD}`로 통일. 비밀번호는 교체하지 않기로 함 (사람 결정 2026-11-23): 이전 커밋(`4f29537` 등)에 남은 값은 계속 유효 | 2026-11-23 | — |
| TODO-10 관리자 사용자 관리 | `/api/admin/users` 목록·검색·상세, 이용 정지(기한 선택·사유)·해제, 역할 변경. 정지·역할 변경 시 세션 무효화, 정지된 회원 로그인 403 `ACCOUNT_SUSPENDED`. 자기 자신·ADMIN 대상 변경 금지. 앱 화면 없이 http로만 사용 | 2026-11-23 | [007](./specs/007-admin-users/) |
| ISSUE-BUG-4 독서 완료 화면의 예시 집중도 | `ReadingResultCard`의 집중도 칸과 `focusPercent`·`focusModeUsed` 제거 (목표 시간·쪽수는 아직 예시 값) | 2026-11-24 | — |
| ISSUE-BUG-5 로그인 화면 상단 잘림 | `LoginScreen`에 `SafeAreaView` 적용. Android 에뮬레이터(Pixel 7)에서 확인, iOS는 미확인 | 2026-11-24 | — |
| TODO-1 독서 인증 앱 연결 | 앱이 `POST /api/reading-records/{id}/certifications`로 사진을 보냄 (가장 최근 회차, 45초). `PASSED`만 통과 | 2026-11-22 | [004](./specs/004-reading-certification-app/) |
| TODO-3 사진 인증 추가 보상 연결 | 세션 저장 때 인증을 세션에 연결하고 `CertificationPhotoChecker`가 조회. 429 통과는 제외 | 2026-11-22 | [004](./specs/004-reading-certification-app/) |
| ASK-5 독서 인증 판정 엄격도 | `UNVERIFIED`는 통과 아님(다시 찍기, 보상 없음). 앱은 쪽 범위를 보내지 않아 쪽 번호 비교 안 함(±3쪽 규칙은 범위를 보내는 호출에만). 앱 대기 45초, 서버 AI 호출은 한 번 다시 시도 | 2026-11-22 | [004](./specs/004-reading-certification-app/) |
| ISSUE-BUG-1 문장 저장 실패 후 재시도 시 세션 중복 | 세션·문장을 한 요청·한 트랜잭션으로 저장, 앱은 문장 API를 따로 부르지 않음 (응답만 끊긴 경우는 ISSUE-BUG-3) | 2026-11-22 | [003](./specs/003-session-sentence-and-cleanup/) |
| ISSUE-BUG-2 세션과 문장이 따로 저장됨 | 세션 저장이 port `SessionSentenceRecorder`로 `SentenceService.recordFromSession` 호출 (쪽 번호 = `endPage`) | 2026-11-22 | [003](./specs/003-session-sentence-and-cleanup/) |
| ISSUE-DATA-1 책 삭제 시 독후활동 남음 | 책 삭제가 port `BookActivityCleaner`로 `ReviewCleanupService.deleteAllOfBook` 호출 (같은 트랜잭션) | 2026-11-22 | [003](./specs/003-session-sentence-and-cleanup/) |
| ISSUE-DATA-2 탈퇴 시 reading 데이터 남음 | `ReadingCleanupListener`가 인증·세션·기록·책 삭제 (탈퇴와 같은 트랜잭션) | 2026-11-22 | [003](./specs/003-session-sentence-and-cleanup/) |
