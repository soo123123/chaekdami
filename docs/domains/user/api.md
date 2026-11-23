> 기준: feature/be3-admin-users (스펙 007) · 최종 확인: 2026-11-23 · 담당: BE3

# user API

공통 규칙: [conventions/api.md](../../conventions/api.md)

## 목록

| 메서드 | 경로 | 설명 | 토큰 | 성공 | 상태 |
|---|---|---|---|---|---|
| POST | `/api/auth/signup` | 회원가입 | 불필요 | 201 | ✅ |
| POST | `/api/auth/login` | 로그인, 토큰 발급 | 불필요 | 200 | ✅ |
| POST | `/api/auth/refresh` | 토큰 재발급 (회전) | 불필요 | 200 | ✅ |
| POST | `/api/auth/logout` | 이 기기 로그아웃 | 불필요 | 204 | ✅ |
| POST | `/api/auth/logout-all` | 모든 기기 로그아웃 | 필요 | 204 | ✅ |
| POST | `/api/auth/password` | 비밀번호 변경 (로그인 상태) | 필요 | 204 | ✅ |
| POST | `/api/auth/password/reset-request` | 재설정 메일 요청 | 불필요 | 204 | ✅ |
| POST | `/api/auth/password/reset` | 메일 토큰으로 새 비밀번호 | 불필요 | 204 | ✅ |
| GET | `/api/me` | 내 정보 | 필요 | 200 | ✅ |
| DELETE | `/api/me` | 회원 탈퇴 | 필요 | 204 | ✅ |
| GET | `/email/reset` | 재설정 메일 링크가 여는 HTML 화면 | 불필요 | 200 | ✅ |
| POST | `/email/reset` | 위 화면의 폼 제출 (form-urlencoded) | 불필요 | 200 | ✅ |
| GET | `/api/admin/users` | [관리자] 회원 목록·검색 | 필요, ADMIN | 200 | ✅ |
| GET | `/api/admin/users/{userId}` | [관리자] 회원 상세 | 필요, ADMIN | 200 | ✅ |
| PUT | `/api/admin/users/{userId}/suspension` | [관리자] 이용 정지 | 필요, ADMIN | 200 | ✅ |
| DELETE | `/api/admin/users/{userId}/suspension` | [관리자] 정지 해제 | 필요, ADMIN | 200 | ✅ |
| PATCH | `/api/admin/users/{userId}/role` | [관리자] 역할 변경 | 필요, ADMIN | 200 | ✅ |

수동 테스트: `backend/http/auth.http`, 관리자 `backend/http/admin-users.http`

---

## POST /api/auth/signup

```json
// 요청
{ "email": "tester@chaekdami.local", "password": "…", "nickname": "tester" }
```

```json
// 응답 201 (UserResponse)
{ "id": 1, "email": "tester@chaekdami.local", "nickname": "tester", "role": "USER" }
```

입력 규칙: [rules.md](./rules.md#1-가입-정보)

## POST /api/auth/login

```json
// 요청
{ "email": "tester@chaekdami.local", "password": "…" }
```

```json
// 응답 200 (LoginResponse)
{
  "accessToken": "eyJ…",
  "refreshToken": "…",
  "tokenType": "Bearer",
  "id": 1,
  "email": "tester@chaekdami.local",
  "nickname": "tester",
  "role": "USER"
}
```

이용이 정지된 계정이면 비밀번호가 맞을 때만 `403 ACCOUNT_SUSPENDED`로 응답하고 토큰을 주지 않는다. 비밀번호가 틀리면 정지 여부와 관계없이 `401 INVALID_CREDENTIALS`다.

```json
// 응답 403 (무기한 정지면 suspendedUntil이 없다)
{ "code": "ACCOUNT_SUSPENDED", "message": "이용이 정지된 계정입니다.", "suspendedUntil": "2026-12-31T23:59:59" }
```

## POST /api/auth/refresh

```json
{ "refreshToken": "…" }
```

응답은 로그인과 같다 (새 토큰 쌍). 이전 Refresh Token은 즉시 폐기된다. **폐기된 토큰을 다시 쓰면** 그 사용자의 모든 토큰이 폐기된다 (강제 로그아웃).

## POST /api/auth/logout

```json
{ "refreshToken": "…" }
```

이 Refresh Token만 폐기한다. Access Token은 만료(최대 15분)까지 유효하다.

## POST /api/auth/logout-all

본문 없음. 모든 Refresh Token 폐기 + `token_version` 증가 → 모든 Access Token도 즉시 무효.

## POST /api/auth/password

```json
{ "currentPassword": "…", "newPassword": "…" }
```

성공하면 모든 토큰이 무효가 된다. 다시 로그인해야 한다.

## POST /api/auth/password/reset-request

```json
{ "email": "tester@chaekdami.local" }
```

가입 여부와 관계없이 204 (계정 존재 여부를 숨김). 가입된 이메일이면 재설정 링크 메일을 보낸다.

## POST /api/auth/password/reset

```json
{ "token": "메일 링크의 토큰", "newPassword": "…" }
```

## GET /api/me

응답: `UserResponse` (`id`, `email`, `nickname`, `role`)

## DELETE /api/me

```json
{ "currentPassword": "…" }
```

---

## 관리자 API

앱 화면 없이 http 요청으로 쓴다. ADMIN 토큰이 필요하다 (아니면 `403 FORBIDDEN`). 규칙: [rules.md §6](./rules.md#6-관리자)

공통 응답 (`AdminUserResult`). `status`는 끝 시각이 지난 정지를 `ACTIVE`로 본 값이다. 비밀번호 해시·토큰은 나오지 않는다.

```json
{
  "id": 2,
  "email": "tester@chaekdami.local",
  "nickname": "tester",
  "role": "USER",
  "status": "SUSPENDED",
  "suspendedUntil": "2026-12-31T23:59:59",
  "createdAt": "2026-11-20T10:00:00",
  "suspensionReason": "신고 누적",
  "suspendedAt": "2026-11-23T15:00:00",
  "suspendedBy": 1
}
```

- 정지 중이 아니면 `suspendedUntil`·`suspensionReason`·`suspendedAt`·`suspendedBy`는 null이다. 정지 중인데 `suspendedUntil`이 null이면 무기한이다.
- 목록 항목에서는 `suspensionReason`·`suspendedAt`·`suspendedBy`가 항상 null이다 (상세에서만).

## GET /api/admin/users

| 파라미터 | 설명 |
|---|---|
| `query` | 이메일·닉네임 부분 일치, 대소문자 무시 (선택) |
| `role` | `USER` · `ADMIN` (선택) |
| `status` | `ACTIVE` · `SUSPENDED` (선택) |
| `page` | 0부터, 기본 0 |
| `size` | 1~100, 기본 20 |

가입일 최신순. 응답은 `PageResponse` (`items`, `page`, `size`, `totalElements`, `hasNext`).

## GET /api/admin/users/{userId}

없으면 `404 USER_NOT_FOUND`.

## PUT /api/admin/users/{userId}/suspension

```json
// 요청 (둘 다 선택. until을 빼면 무기한)
{ "reason": "신고 누적", "until": "2026-12-31T23:59:59" }
```

성공 `200` 상세 응답. 그 회원의 Access·Refresh Token은 바로 무효가 된다. 이미 정지 중이면 사유·끝 시각을 새 값으로 바꾼다.
`reason`은 200자까지. `until`이 지금보다 이전이면 `400 VALIDATION_ERROR`(`fields[].field = "until"`). 자기 자신이면 `400 CANNOT_MODIFY_SELF`, 대상이 ADMIN이면 `400 CANNOT_MODIFY_ADMIN`.

## DELETE /api/admin/users/{userId}/suspension

성공 `200` 상세 응답. 정지 중이 아니어도 200이다. 대상이 ADMIN이어도 해제할 수 있다. 토큰은 그대로 둔다.

## PATCH /api/admin/users/{userId}/role

```json
{ "role": "ADMIN" }
```

성공 `200` 상세 응답. 역할이 바뀌면 그 회원의 토큰이 무효가 되어 다시 로그인해야 새 역할이 적용된다. 같은 역할이면 아무것도 바꾸지 않는다.
자기 자신이면 `400 CANNOT_MODIFY_SELF`, 대상이 ADMIN이면 `400 CANNOT_MODIFY_ADMIN` (ADMIN을 USER로 내리는 것은 DB에서 직접 한다).

---

## 에러 코드

정의: `user/presentation/GlobalExceptionHandler.java`

| HTTP | code | 언제 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 형식·길이·비밀번호 규칙·닉네임 규칙 위반 (`fields`에 칸별 메시지) |
| 401 | `INVALID_CREDENTIALS` | 이메일 또는 비밀번호가 틀림 (계정 존재 여부를 구분하지 않음) |
| 401 | `UNAUTHORIZED` | 토큰 없음·만료·폐기, `token_version` 불일치, 재설정 토큰 무효 |
| 400 | `CANNOT_MODIFY_SELF` | 관리자가 자기 계정을 정지하거나 역할을 바꾸려 함 |
| 400 | `CANNOT_MODIFY_ADMIN` | 관리자 계정을 정지하거나 역할을 바꾸려 함 |
| 403 | `FORBIDDEN` | 권한 없음 (관리자 API를 일반 사용자가 부름 등) |
| 403 | `ACCOUNT_SUSPENDED` | 정지된 계정으로 로그인 (비밀번호가 맞을 때만). `suspendedUntil` 포함 |
| 404 | `USER_NOT_FOUND` | 관리자 API에서 없는 회원 번호 |
| 409 | `EMAIL_ALREADY_EXISTS` | 이미 가입된 이메일 |
| 409 | `NICKNAME_ALREADY_EXISTS` | 이미 쓰는 닉네임 (대소문자 무시) |
| 429 | `TOO_MANY_ATTEMPTS` | 로그인 5회 실패 후 15분 잠금, 재설정 요청 초과 |
