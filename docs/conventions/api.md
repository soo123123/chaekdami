> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE3

# API 공통 규칙

도메인별 API는 [domains/](../domains/)의 각 `api.md`에 있다. 이 문서는 모든 API에 공통인 것만 적는다.

## 1. 주소

| 항목 | 값 |
|---|---|
| 서버 주소 (로컬) | `http://localhost:8080` |
| API 경로 | `{서버 주소}/api/...` |
| 앱 설정 | `EXPO_PUBLIC_API_BASE_URL` (없으면 `http://localhost:8080`) — `frontend/src/api/apiClient.ts` |
| 요청 시간 제한 (앱) | 10초 — `apiClient.ts` |

경로는 리소스 중심 REST로 쓴다. 복수 명사, ID는 경로 변수, 행동은 하위 경로(`/complete`, `/purchase`, `/use`)로 표현한다.

## 2. 인증

| 항목 | 규칙 | 코드 |
|---|---|---|
| 방식 | JWT. 헤더 `Authorization: Bearer {accessToken}` (Bearer 뒤 공백 한 칸) | `JwtAuthenticationFilter` |
| Access Token 유효기간 | 15분 | `JwtTokenProvider.ACCESS_TOKEN_VALIDITY_SECONDS` |
| Refresh Token 유효기간 | 90일 | `jwt.refresh-token-validity-in-seconds` |
| 토큰 없이 부를 수 있는 API | `POST /api/auth/{signup, login, refresh, logout, password/reset-request, password/reset}`, `/email/**` | `SecurityConfig` |
| 관리자 전용 | `/api/admin/**` (`ADMIN` 권한) | `SecurityConfig` |
| 그 밖의 모든 API | 로그인 필요 | `SecurityConfig` |

### 토큰 재발급 흐름 (앱)

`frontend/src/api/apiClient.ts`가 자동으로 처리한다.

```
API 요청 → 401
  → POST /api/auth/refresh { refreshToken } (동시에 여러 요청이 401이어도 재발급은 1번)
  → 성공: 새 토큰 저장 → 원래 요청 1번 재시도
  → 실패: 토큰 삭제 → 로그인 화면으로
```

`/api/auth/*` 요청의 401은 재발급을 시도하지 않는다. 토큰은 `expo-secure-store`에 저장한다 (`frontend/src/utils/tokenStorage.ts`).

### X-User-Id 헤더 (과도기)

독서(`reading`)·보상(`reward`) 컨트롤러는 아직 `@RequestHeader("X-User-Id")`로 사용자를 받는다.
**앱은 이 헤더를 보내지 않아도 된다.** `JwtAuthenticationFilter`가 클라이언트가 보낸 값은 버리고, 토큰의 사용자 번호를 이 헤더 값으로 넣어 준다. 컨트롤러를 `CurrentUser`로 바꾸면 이 처리를 없앤다 (⏳ [TODO-16](../known-issues.md#todo-16)).

## 3. 요청·응답 형식

| 항목 | 규칙 |
|---|---|
| 본문 | JSON, `Content-Type: application/json` |
| 필드 이름 | camelCase (DB는 snake_case) |
| 날짜 | `"2026-11-20"` |
| 시각 | `"2026-11-20T21:30:00"` — 서버 시간 기준, 시간대 표기 없음 |
| 성공 응답 | 감싸지 않고 데이터 그대로 반환. 삭제 등 본문 없는 성공은 `204` |
| 목록 페이지 | `PageResponse` 형식을 쓰는 API가 있다 (`global/dto/PageResponse.java`). 각 API 문서 참고 |

## 4. 에러 응답

실패는 항상 이 모양이다. `fields`는 입력값 오류일 때만 있다.

```json
{
  "code": "VALIDATION_ERROR",
  "message": "요청 값이 올바르지 않습니다.",
  "fields": [{ "field": "email", "message": "이메일 형식이 아닙니다." }]
}
```

처리 위치:
- `user/presentation/GlobalExceptionHandler.java` — 전체 공통
- `reading/presentation/ReadingExceptionHandler.java` — reading 패키지의 `IllegalArgumentException` → 400 `VALIDATION_ERROR` (`fields` 없음)
- `SecurityConfig` — 인증 실패 401, 권한 없음 403
- `JwtAuthenticationFilter` — 토큰 버전 확인 중 오류 500 `INTERNAL_ERROR`
- 도메인 에러는 `global/error/ErrorCode`를 구현한 enum + `BusinessException` (보상은 `RewardException`)

## 5. 에러 코드 표

### 공통

| HTTP | code | 언제 | 앱 처리 |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | 입력값 검증 실패, 본문 형식 오류, 파라미터 누락·형식 오류, 도메인 규칙 위반(`IllegalArgumentException`) | 메시지 표시 (`fields` 있으면 입력칸 옆에) |
| 401 | `UNAUTHORIZED` | 토큰 없음·만료·무효, `token_version` 불일치 | 토큰 재발급 → 실패 시 로그인 화면 |
| 403 | `FORBIDDEN` | 권한 없음 | 메시지 표시 |
| 404 | `NOT_FOUND` | reading 도메인의 대상 없음 (`ResponseStatusException`) | 메시지 표시 |
| 409 | `CONFLICT` | reading 도메인의 충돌 (`ResponseStatusException`) | 메시지 표시 |
| 500 | `INTERNAL_ERROR` | 처리하지 못한 오류, 토큰 확인 중 서버 오류(DB 장애 등) | 잠시 후 다시 시도 |

### 도메인별

| 도메인 | 코드 정의 위치 | 목록 |
|---|---|---|
| user | `GlobalExceptionHandler` | [domains/user/api.md](../domains/user/api.md#에러-코드) |
| reading | `ResponseStatusException` (공통 코드로 변환) | [domains/reading/api.md](../domains/reading/api.md#에러-코드) |
| review | `ReviewErrorCode` (code = enum 이름) | [domains/review/api.md](../domains/review/api.md#에러-코드) |
| reward | `RewardErrorCode` (code = `REWARD_00X` 등) | [domains/reward/api.md](../domains/reward/api.md#에러-코드) |
| dday | 공통 코드만 사용 | [domains/dday/api.md](../domains/dday/api.md) |

### 정리 필요 — ⏳ [TODO-15](../known-issues.md#todo-15)

- 에러 코드 이름 방식이 도메인마다 다르다. review는 enum 이름(`REVIEW_NOT_FOUND`), reward는 번호(`REWARD_001`), reading은 HTTP 상태별 공통 코드(`NOT_FOUND`)다.
- reading은 아직 `ErrorCode` enum이 없어 404·409를 구분하는 code가 없다. 앱은 `message`로만 구분할 수 있다.
- `GlobalExceptionHandler`가 `user` 패키지에 있지만 전체 공통이다.

## 6. CORS

허용 Origin 기본값은 `http://localhost:*`, `http://127.0.0.1:*`이다. 설정: `cors.allowed-origin-patterns` (`SecurityConfig`).
