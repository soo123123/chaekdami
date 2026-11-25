> 상태: done · 작성: 2026-11-25 · 기준: feature/be3-request-limits@71e4030 · 담당: BE3 · 승인: BE3
> 요구사항: [requirements.md](./requirements.md)

# 011 · 신고·비밀번호 재설정 요청 제한 — Design

## ① 흐름

```
신고: POST /api/reviews/{reviewId}/reports ─▶ ReviewSocialService.report (한 트랜잭션)
  1. 입력·공개 여부·내 리뷰 검사 (지금과 같음)
  2. 신고하는 회원 행 잠금 (port UserLock → UserRepository.findByIdForUpdate)   R1.5
  3. 신고 저장 (insertIfAbsent) → 이미 있으면 409 ALREADY_REPORTED              R1.4
  4. 이 회원의 오늘(한국 날짜) 신고 수가 20을 넘으면 429 → 3의 저장도 롤백       R1.2
  5. 리뷰 신고 수 증가·블라인드 (지금과 같음)

재설정: POST /api/auth/password/reset-request ─▶ LoginAttemptLimiter.consumePasswordResetRequest (한 트랜잭션)
  1. 이메일+IP 행을 만들고 잠금 → 잠금 기간이면 429 (행 추가도 롤백)             R2.4, R2.7
  2. 이메일 행을 만들고 잠금 → 잠금 기간이면 429                                R2.2
  3. 두 행의 횟수를 함께 증가
```

## ② 바뀌는 것

| 구분 | 변경 | 관련 R |
|---|---|---|
| API | 주소·필드 없음. 신고에 `429 TOO_MANY_ATTEMPTS` 응답 추가 | R1.2 |
| DB | 테이블·컬럼 변경 없음. 신고 수는 `review_reports.created_at`으로 센다. `auth_attempts`에 `reset|{email}|*` 키를 추가로 쓴다 | R1, R2 |
| 비즈니스 규칙 | 신고 회원별 하루 20번. 재설정 이메일별 1시간에 10번, 10번째부터 1시간 잠금 | R1, R2 |

- **이메일 행의 키** `reset|{email}|*`는 탈퇴 때 지우는 앞부분(`reset|{email}|`)에 포함돼 따로 지우지 않아도 된다 (R2.8).
- **1시간 계산**은 지금의 제한과 같은 방식이다. 첫 요청부터 1시간을 한 구간으로 세고, 10번째 요청에서 1시간 잠근다. 11번째가 이 1시간 안이면 429다. 9번 이하로 요청하고 구간이 끝나면 0부터 다시 센다. 그래서 구간 경계를 걸치면 어떤 1시간에는 10번을 넘을 수 있다.
- **가입 여부**: 회원을 조회하기 전에 세므로 가입하지 않은 이메일도 같다 (R2.5).
- **동시 요청**: 지금은 같은 키의 첫 요청이 겹치면 UNIQUE 오류가 나고, 겹친 횟수가 하나로 세어질 수 있다. 이메일 행은 여러 IP가 함께 써서 겹치기 쉽다. 그래서 행을 `insert ... on conflict do nothing`으로 만들고 잠근 뒤 센다. 로그인 실패 기록도 같은 코드를 쓰므로 함께 적용된다 (횟수 기준은 그대로).
- **신고 수**: 리뷰가 지워지면 그 신고도 지워져 오늘 횟수에서 빠진다. 블라인드 해제는 신고를 남기므로 횟수에 그대로 남는다.
- 신고 저장의 `on conflict (review_id, user_id) do nothing`에서 대상 컬럼을 뺀다. 이 테이블의 다른 UNIQUE는 자동 번호뿐이라 동작은 같고, H2로 실제 트랜잭션 테스트를 할 수 있다.

## ③ 수정할 파일

| 파일 | 변경 내용 |
|---|---|
| `backend/src/main/java/com/chaekdami/user/application/LoginAttemptLimiter.java` | 이메일별 제한, 행 잠금 |
| `backend/src/main/java/com/chaekdami/user/infrastructure/AuthAttemptRepository.java` | 행 만들기, 잠금 조회 |
| `backend/src/main/java/com/chaekdami/review/application/ReviewSocialService.java` | 회원 잠금, 하루 제한 |
| `backend/src/main/java/com/chaekdami/review/application/port/UserLock.java` | 새 파일 |
| `backend/src/main/java/com/chaekdami/review/infrastructure/UserRepositoryLock.java` | 새 파일. `UserLock` 구현 |
| `backend/src/main/java/com/chaekdami/review/infrastructure/ReviewReportRepository.java` | 오늘 신고 수 조회, `on conflict` 대상 컬럼 제거 |
| `backend/src/main/java/com/chaekdami/review/domain/ReviewErrorCode.java` | `TOO_MANY_ATTEMPTS` (429) |
| `backend/src/test/java/com/chaekdami/review/application/ReviewReportLimitTest.java` | 새 파일. H2로 제한·롤백·동시 신고 |
| `backend/src/test/java/com/chaekdami/review/application/ReviewSocialServiceTest.java` | 생성자 변경 반영 |
| `backend/src/test/java/com/chaekdami/user/application/PasswordResetLimitTest.java` | 새 파일. H2로 이메일별 제한·동시 요청 |
| `backend/src/test/java/com/chaekdami/user/application/LoginAttemptLimiterTest.java` | 저장 방식 변경 반영 |
| `backend/src/test/java/com/chaekdami/user/application/UserServiceLoginAttemptTest.java` | 저장 방식 변경 반영 |
| `backend/src/test/java/com/chaekdami/user/application/WithdrawAuthAttemptsTest.java` | 이메일 기록 추가에 맞춘 기대값, R2.8 확인 |

## ④ 고칠 docs 문서

- [x] `docs/domains/user/rules.md` — 이메일별 재설정 제한, 동시 요청
- [x] `docs/domains/user/api.md` — 429 설명
- [x] `docs/domains/user/data.md` — `auth_attempts` 키
- [x] `docs/domains/review/rules.md` — 하루 신고 제한
- [x] `docs/domains/review/api.md` — 신고 429
- [x] `docs/domains/review/overview.md` — review → user 연결에 회원 잠금
- [ ] `docs/known-issues.md` — 병합 뒤 ISSUE-SEC-4 처리 (main에서, 닫을지는 사람이 정함)

## ⑤ 남은 질문 (❓)

- 없음

---

## 변경 기록

| 날짜 | 바뀐 내용 | 이유 | 결정 |
|---|---|---|---|
| 2026-11-25 | ③에 `WithdrawAuthAttemptsTest.java` 추가 | 재설정 때 이메일 기록이 하나 더 생겨 기대값이 바뀜 (design에서 빠짐) | BE3: 추가하고 진행 |
