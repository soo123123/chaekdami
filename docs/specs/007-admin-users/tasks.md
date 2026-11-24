> 상태: done · 작성: 2026-11-23 · 기준: feature/be3-admin-users@2c3e189 · 담당: BE3
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# 007 · 관리자 사용자 관리 — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. 끝난 작업은 체크한다.
- 작업 하나는 한 번에 끝나고 바로 검증할 수 있는 크기로 쪼갠다.
- 설계와 다르게 해야 하면 멈추고 보고한다. (S10)

## 1. 도메인·저장소

- [x] 1.1 `UserStatus` enum, `User`에 정지 칸 5개와 `suspend`·`unsuspend`·`changeRole`·`isSuspendedAt`·`effectiveStatus` — R4.1, R4.5, R4.7, R5.1, R6.1
      검증: `UserTest`
- [x] 1.2 `UserErrorCode` (`USER_NOT_FOUND`·`CANNOT_MODIFY_SELF`·`CANNOT_MODIFY_ADMIN`·`ACCOUNT_SUSPENDED`) — R3.2, R7
      검증: `cd backend && ./gradlew compileJava`
- [x] 1.3 `UserRepository` 관리자 목록 검색 쿼리 (검색어·역할·상태·지금 시각) — R2.1~R2.3
      검증: `cd backend && ./gradlew compileJava`

## 2. 로그인

- [x] 2.1 `UserService`: `invalidateSessions(User)` 추출 (`logoutAll`이 사용), 로그인 비밀번호 확인 뒤 정지면 `AccountSuspendedException` — R4.2, R4.3, R4.4, R4.8
      검증: `UserServiceLoginAttemptTest`, `UserServiceTokenVersionTest`

## 3. 관리자 서비스·API

- [x] 3.1 `AdminUserResult`, `UserAdminService` (목록·상세·정지·해제·역할 변경, 자기 자신·ADMIN 거절, 끝 시각 과거 거절) — R2, R3, R4, R5, R6, R7
      검증: `UserAdminServiceTest`
- [x] 3.2 `UserAdminController`, `SuspendRequest`, `ChangeRoleRequest` — R1, R2~R6
      검증: `cd backend && ./gradlew compileJava`
- [x] 3.3 `ApiErrorResponse.suspendedUntil`, `GlobalExceptionHandler`의 `ACCOUNT_SUSPENDED` 403 처리 — R4.3
      검증: `cd backend && ./gradlew compileJava`
- [x] 3.4 `backend/http/admin-users.http` 요청 예시 — R8.1
      검증: 파일 확인

## 4. 테스트

- [x] 4.1 `UserTest`, `UserAdminServiceTest`, `UserServiceLoginAttemptTest`에 테스트 추가 — R2~R7
      검증: `cd backend && ./gradlew test --tests "com.chaekdami.user.*"`

## 9. 마무리

- [x] 9.1 전체 테스트 — 검증: `cd backend && ./gradlew test` (260개 중 `ChaekdamiApplicationTests.contextLoads` 1개 실패: DB 환경변수 없음, TODO-21)
- [x] 9.2 계약 검사 — 검증: `python3 scripts/harness/contract-check.py`
- [x] 9.3 **docs 반영**: design ④의 문서 전부 수정 (known-issues 해결 처리는 PR 병합 후) — R8.1 — 검증: `python3 scripts/harness/docs-check.py`
- [x] 9.4 상태 줄을 done으로, `docs/specs/README.md` 목록 갱신
