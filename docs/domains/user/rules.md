> 기준: feature/003-session-sentence (스펙 003) · 최종 확인: 2026-11-22 · 담당: BE3

# user 규칙

## 1. 가입 정보

| 규칙 | 값 | 코드 위치 |
|---|---|---|
| 이메일 | 이메일 형식, 254자 이하. 공백 제거·소문자로 저장 | `SignUpRequest`, `UserService` |
| 비밀번호 길이 | 8~72자 | `SignUpRequest` (`@Size`) |
| 비밀번호 문자 종류 | 영문 대문자·소문자·숫자·특수문자 중 **2종류 이상** | `PasswordPolicyValidator` |
| 허용 특수문자 | `!$%&()*+,-./:<=>?@[]^_{|}~` | `PasswordPolicyValidator.ALLOWED_SPECIALS` |
| 금지 | 공백, 한글, `' " ; \ \` #` | `PasswordPolicyValidator.BLOCKED_CHARS` |
| 비밀번호 ≠ 아이디 | 이메일·닉네임과 같은 비밀번호 불가 | `PasswordNotIdentityValidator` |
| 닉네임 | 앞뒤 공백 제거 후 2~16자, 영문·숫자·한글만 | `NicknameRules` |
| 닉네임 중복 | 대소문자 무시 (`nickname_lower` UNIQUE) | `User` |

## 2. 토큰

| 규칙 | 값 | 코드 위치 |
|---|---|---|
| Access Token | JWT, 15분 | `JwtTokenProvider.ACCESS_TOKEN_VALIDITY_SECONDS` |
| Refresh Token | 90일, 원문은 응답으로만 주고 DB에는 SHA-256 해시 | `jwt.refresh-token-validity-in-seconds`, `RefreshToken` |
| 회전 | 재발급하면 이전 Refresh Token 즉시 폐기 | `UserService.refresh` |
| 재사용 감지 | 폐기된 Refresh Token이 다시 오면 그 사용자의 Refresh Token 전부 폐기 + `token_version` 증가 | `UserService.refresh` |
| 즉시 무효화 | 비밀번호 변경·재설정, 전체 로그아웃, 재사용 감지 시 `token_version` 증가. 필터가 JWT 값과 DB 값을 비교해 다르면 401 | `TokenVersionChecker`, `JwtAuthenticationFilter` |
| 단일 로그아웃 | 그 Refresh Token만 폐기. Access Token은 최대 15분 유효 | `UserService.logout` |
| 서명 키 | 환경변수 `JWT_SECRET` | `application.properties` |

## 3. 로그인·비밀번호 재설정 제한

| 규칙 | 값 | 코드 위치 |
|---|---|---|
| 기준 | 이메일 + 클라이언트 IP | `LoginAttemptLimiter` |
| 로그인 | 15분 안에 5번 실패하면 15분 잠금 (429). 1~4번째는 401이며 계정 존재 여부를 구분하지 않음 | `LoginAttemptLimiter.MAX_ATTEMPTS`·`WINDOW`·`LOCK` |
| 재설정 요청 | 15분 안에 5번까지는 가입 여부와 관계없이 204, 6번째부터 15분 동안 429 | `LoginAttemptLimiter.consumePasswordResetRequest` |
| 타이밍 공격 방지 | 없는 이메일도 더미 해시로 비밀번호 비교 | `UserService.DUMMY_PASSWORD_HASH` |

## 4. 비밀번호 재설정

| 규칙 | 값 | 코드 위치 |
|---|---|---|
| 토큰 유효 | 15분, 1회용 | `UserService.PASSWORD_RESET_TOKEN_MINUTES` |
| 메일 | Gmail SMTP, 비밀번호 `MAIL_PASSWORD` | `SmtpPasswordResetNotifier` |
| 링크 주소 | `app.public-base-url` + `/email/reset?token=…` | `EmailPageController` |
| 성공 후 | 모든 토큰 무효 | `UserService.resetPassword` |

## 5. 회원 탈퇴

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 확인 | 현재 비밀번호 필요 | `WithdrawRequest` | ✅ |
| 다른 도메인 데이터 | 같은 트랜잭션에서 review·reward·dday·reading 리스너가 먼저 삭제 | `UserWithdrawnEvent` | ✅ |
