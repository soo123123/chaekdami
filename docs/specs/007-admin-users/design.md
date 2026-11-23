> 상태: approved · 작성: 2026-11-23 · 기준: feature/be3-admin-users@2c3e189 · 담당: BE3 · 승인: BE3
> 요구사항: [requirements.md](./requirements.md)

# 007 · 관리자 사용자 관리 — Design

## ① 흐름

```
[http] ─ GET   /api/admin/users?query=&role=&status=&page=&size= ─┐
[http] ─ GET   /api/admin/users/{userId} ──────────────────────────┤
[http] ─ PUT   /api/admin/users/{userId}/suspension  {reason, until}┼─▶ UserAdminController ─▶ UserAdminService
[http] ─ DELETE /api/admin/users/{userId}/suspension ───────────────┤      (/api/admin/** → SecurityConfig가 ADMIN만 통과: R1)
[http] ─ PATCH /api/admin/users/{userId}/role        {role} ───────┘

UserAdminService
  ├ 목록: UserRepository.searchForAdmin(검색어·역할·상태·now, Pageable) → PageResponse<AdminUserResult>
  ├ 상세: findById → 없으면 404 USER_NOT_FOUND
  ├ 정지: 대상 검사(자기 자신·ADMIN → 400) → User.suspend(...) → UserService.invalidateSessions(user)
  ├ 해제: User.unsuspend()  (ADMIN이어도 허용, 토큰은 그대로)
  └ 역할: 대상 검사 → 같은 역할이면 그대로 → User.changeRole(...) → UserService.invalidateSessions(user)

로그인 (UserService.login)
  비밀번호 확인 ─ 틀림 → 401 INVALID_CREDENTIALS (지금과 같음, R4.4)
               └ 맞음 → user.isSuspendedAt(now)? → 403 ACCOUNT_SUSPENDED {suspendedUntil} (R4.3)
                                                  └ 아니면 토큰 발급
```

- **세션 무효화**(R4.2, R6.2)는 지금 전체 로그아웃이 하는 일과 같다: `token_version` +1, 그 사용자의 Refresh Token 전부 폐기. 필터가 요청마다 버전을 비교하므로 Access Token은 다음 요청부터 401, 폐기된 Refresh Token은 재발급에서 401이다. `UserService`에 패키지 전용 메서드 `invalidateSessions(User)`를 두고 `logoutAll`과 관리자 서비스가 함께 쓴다.
- **정지 상태 판단**은 "상태가 SUSPENDED이고, 끝 시각이 없거나 지금보다 뒤"일 때만 정지로 본다. 끝 시각이 지나면 저장된 값은 그대로지만 정지가 아닌 것으로 본다 (R4.5). 스케줄러를 두지 않는다. 목록·상세의 `status`도 이 기준으로 계산한 값을 돌려준다.
- 비밀번호 재설정 흐름은 바꾸지 않는다. 정지 여부를 보지 않으므로 정지된 회원도 재설정할 수 있고, 재설정은 정지 칸을 건드리지 않는다 (R4.8).
- 시각은 user 도메인의 다른 코드와 같이 `LocalDateTime.now()`를 쓴다.

## ② 바뀌는 것

| 구분 | 변경 | 관련 R |
|---|---|---|
| API | `GET /api/admin/users` (목록·검색, 페이지 0부터, size 기본 20·최대 100) | R2 |
| API | `GET /api/admin/users/{userId}` (상세) | R3 |
| API | `PUT /api/admin/users/{userId}/suspension` 본문 `{ "reason": 선택·최대 200자, "until": 선택 ISO 시각 }` → 200 상세 | R4 |
| API | `DELETE /api/admin/users/{userId}/suspension` → 200 상세 | R5 |
| API | `PATCH /api/admin/users/{userId}/role` 본문 `{ "role": "USER" \| "ADMIN" }` → 200 상세 | R6 |
| API | 로그인 응답에 `403 ACCOUNT_SUSPENDED` 추가. 본문 `{ code, message, suspendedUntil }` (무기한이면 `suspendedUntil` 없음) | R4.3 |
| DB | `users`에 컬럼 5개 추가 (모두 NULL 허용): `status`(`ACTIVE`·`SUSPENDED`, NULL은 ACTIVE로 봄), `suspended_until`, `suspension_reason`(200), `suspended_at`, `suspended_by`(관리자 회원 번호) | R4, R3.1 |
| 에러 코드 | `USER_NOT_FOUND`(404), `CANNOT_MODIFY_SELF`(400), `CANNOT_MODIFY_ADMIN`(400), `ACCOUNT_SUSPENDED`(403). 끝 시각이 과거면 `VALIDATION_ERROR`(400, field `until`) | R3.2, R7, R4.3, R4.6 |
| 비즈니스 규칙 | 정지·역할 변경 시 세션 무효화. 정지된 회원 로그인 403. 자기 자신·ADMIN 대상 정지·역할 변경 금지(해제는 허용) | R4, R6, R7 |

- **새 컬럼을 NULL 허용으로 두는 이유**: `ddl-auto=update`는 이미 행이 있는 테이블에 NOT NULL 컬럼을 기본값 없이 추가하지 못한다. 기존 회원은 `status`가 NULL이고 ACTIVE로 본다 (`Certification.aiSkipped`와 같은 방식). 새 컬럼이라 [TODO-18](../../known-issues.md#todo-18)의 "기존 CHECK 제약이 안 바뀌는" 문제는 생기지 않는다.
- **에러 코드**는 review처럼 이름 방식으로, 공용 `ErrorCode`를 구현한 `UserErrorCode` enum에 둔다 (`BusinessException`으로 던짐). `ACCOUNT_SUSPENDED`는 `suspendedUntil` 칸이 더 있어 전용 예외와 처리기를 둔다.
- 목록 검색은 이메일·`nickname_lower`에 대한 `LIKE '%검색어%'` (소문자로 바꿔서). 회원 수가 적어 인덱스는 추가하지 않는다.

## ③ 수정할 파일

| 파일 | 변경 내용 |
|---|---|
| `backend/src/main/java/com/chaekdami/user/domain/User.java` | 정지 칸 5개, `suspend`·`unsuspend`·`changeRole`·`isSuspendedAt`·`effectiveStatus` |
| `backend/src/main/java/com/chaekdami/user/domain/UserStatus.java` | 새 enum `ACTIVE`·`SUSPENDED` |
| `backend/src/main/java/com/chaekdami/user/domain/UserErrorCode.java` | 새 에러 코드 enum (`ErrorCode` 구현) |
| `backend/src/main/java/com/chaekdami/user/infrastructure/UserRepository.java` | 관리자 목록 검색 쿼리 |
| `backend/src/main/java/com/chaekdami/user/application/UserService.java` | 로그인 정지 검사, `invalidateSessions(User)` 추출 (`logoutAll`이 사용) |
| `backend/src/main/java/com/chaekdami/user/application/UserAdminService.java` | 새 서비스: 목록·상세·정지·해제·역할 변경 |
| `backend/src/main/java/com/chaekdami/user/application/result/AdminUserResult.java` | 새 결과 (목록·상세 공용, 상세 칸은 목록에서 null) |
| `backend/src/main/java/com/chaekdami/user/application/exception/AccountSuspendedException.java` | 새 예외 (`suspendedUntil` 포함) |
| `backend/src/main/java/com/chaekdami/user/presentation/UserAdminController.java` | 새 컨트롤러 (API 5개) |
| `backend/src/main/java/com/chaekdami/user/presentation/dto/SuspendRequest.java` | 정지 요청 (`reason` 200자, `until`) |
| `backend/src/main/java/com/chaekdami/user/presentation/dto/ChangeRoleRequest.java` | 역할 변경 요청 (`role` 필수) |
| `backend/src/main/java/com/chaekdami/user/presentation/dto/ApiErrorResponse.java` | `suspendedUntil` 칸 추가 (NULL이면 응답에서 빠짐, 다른 에러 응답은 그대로) |
| `backend/src/main/java/com/chaekdami/user/presentation/GlobalExceptionHandler.java` | `AccountSuspendedException` → 403 처리기 |
| `backend/src/test/java/com/chaekdami/user/domain/UserTest.java` | 정지·해제·끝 시각 경과·역할 변경 테스트 |
| `backend/src/test/java/com/chaekdami/user/application/UserAdminServiceTest.java` | 새 테스트: 404·자기 자신·ADMIN 거절·세션 무효화·같은 역할·해제 |
| `backend/src/test/java/com/chaekdami/user/application/UserServiceLoginAttemptTest.java` | 정지된 회원 로그인 403, 비밀번호 틀리면 401 테스트 |
| `backend/http/admin-users.http` | 새 요청 예시 |

## ④ 고칠 docs 문서

- [ ] `docs/domains/user/api.md` — 목록 표에 관리자 API 5개, 각 절, 로그인 `403 ACCOUNT_SUSPENDED`, 에러 코드 표
- [ ] `docs/domains/user/rules.md` — "6. 관리자" 절 (정지 판단·세션 무효화·관리자 보호·재설정 허용)
- [ ] `docs/domains/user/data.md` — `users`에 새 컬럼 5개
- [ ] `docs/domains/user/overview.md` — 현재 상태에서 TODO-10 줄을 ✅로
- [ ] `docs/known-issues.md` — PR이 main에 병합된 뒤 TODO-10 해결 처리 (main에서 `known-issues.py`로)

## ⑤ 남은 질문 (❓)

- 없음

---

## 변경 기록

| 날짜 | 바뀐 내용 | 이유 | 결정 |
|---|---|---|---|
| | | | |
