> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE3

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

수동 테스트: `backend/http/auth.http`

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

## 에러 코드

정의: `user/presentation/GlobalExceptionHandler.java`

| HTTP | code | 언제 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 형식·길이·비밀번호 규칙·닉네임 규칙 위반 (`fields`에 칸별 메시지) |
| 401 | `INVALID_CREDENTIALS` | 이메일 또는 비밀번호가 틀림 (계정 존재 여부를 구분하지 않음) |
| 401 | `UNAUTHORIZED` | 토큰 없음·만료·폐기, `token_version` 불일치, 재설정 토큰 무효 |
| 403 | `FORBIDDEN` | 권한 없음 |
| 409 | `EMAIL_ALREADY_EXISTS` | 이미 가입된 이메일 |
| 409 | `NICKNAME_ALREADY_EXISTS` | 이미 쓰는 닉네임 (대소문자 무시) |
| 429 | `TOO_MANY_ATTEMPTS` | 로그인 5회 실패 후 15분 잠금, 재설정 요청 초과 |
