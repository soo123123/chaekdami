> 기준: feature/be3-nickname (스펙 010) · 최종 확인: 2026-11-25 · 담당: BE3
> 기준: feature/be3-admin-users (스펙 007) · 최종 확인: 2026-11-23 · 담당: BE3

# user — 회원과 인증

회원가입, 로그인, JWT 토큰 발급·재발급·폐기, 비밀번호 변경·재설정, 회원 탈퇴를 맡는 도메인. 모든 API의 인증 필터도 여기서 관리한다.

## 핵심 개념

| 개념 | 설명 | 자세히 |
|---|---|---|
| Access Token | 15분짜리 JWT. 요청마다 `Authorization: Bearer` | [rules.md](./rules.md#2-토큰) |
| Refresh Token | 90일. 재발급할 때마다 새것으로 바뀌고(회전) 이전 것은 폐기 | [rules.md](./rules.md#2-토큰) |
| token_version | 이 값이 바뀌면 이미 발급된 Access Token도 즉시 무효 | [rules.md](./rules.md#2-토큰) |
| 로그인 잠금 | 같은 이메일+IP로 5번 실패하면 15분 잠금 | [rules.md](./rules.md#3-로그인비밀번호-재설정-제한) |
| 비밀번호 재설정 | 메일 링크(15분, 1회용) → `/email/reset` 화면 또는 API | [rules.md](./rules.md#4-비밀번호-재설정) |
| 회원 탈퇴 | 비밀번호 확인 후 삭제, 다른 도메인에 이벤트로 알림 | [rules.md](./rules.md#5-회원-탈퇴) |
| 권한 | `USER` · `ADMIN`. `/api/admin/**`는 ADMIN만 | [conventions/api.md](../../conventions/api.md#2-인증) |

## 코드 위치

```
backend/src/main/java/com/chaekdami/
├── config/          SecurityConfig, JwtAuthenticationFilter, JwtTokenProvider, AccessTokenClaims
└── user/
    ├── presentation/    UserController, EmailPageController(/email/reset), GlobalExceptionHandler(전체 공통),
    │                    ClientAddress, dto/, validation/(비밀번호·닉네임 규칙)
    ├── application/     UserService, CurrentUser, AccessGuard, LoginAttemptLimiter, TokenVersionChecker,
    │                    PasswordResetNotifier, OutboundMail, event/UserWithdrawnEvent, exception/
    ├── domain/          User, RefreshToken, PasswordResetToken, AuthAttempt, Role
    └── infrastructure/  Repository, SmtpOutboundMail, SmtpPasswordResetNotifier
```

프론트: `frontend/src/api/authApi.ts`, `apiClient.ts`(토큰 첨부·재발급), `utils/tokenStorage.ts`(SecureStore), 화면 `LoginScreen` · `SignupScreen` · `ForgotPasswordScreen` · `MyPageScreen` (FE2)

## 다른 도메인과의 연결

| 방향 | 무엇 | 방식 |
|---|---|---|
| 모든 도메인 → user | 현재 사용자 | review·reminder는 `CurrentUser`, reading·reward·dday는 `X-User-Id` 헤더(필터가 토큰 사용자로 채움) |
| user → review·reward·dday·reading·reminder | 회원 탈퇴 시 데이터 삭제 | 이벤트 `UserWithdrawnEvent` (같은 트랜잭션). reading은 `ReadingCleanupListener` |
| review → user | 작성자 닉네임 | `UserNicknameReader` |

## 현재 상태

- ✅ 가입, 로그인, 재발급, 로그아웃(단일·전체), 비밀번호 변경·재설정, 내 정보, 닉네임 변경 (스펙 010), 탈퇴, 로그인·재설정 요청 제한
- ✅ 관리자 회원 목록·검색·상세, 이용 정지·해제, 역할 변경 (스펙 007)
