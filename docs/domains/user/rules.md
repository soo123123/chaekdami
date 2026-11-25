> 기준: feature/be3-community-report (스펙 012) · 최종 확인: 2026-11-25 · 담당: BE3

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
| 닉네임 변경 | 가입과 같은 규칙. 자기 비밀번호와 같은 닉네임 불가. 지금과 같은 닉네임·대소문자만 변경은 허용. 횟수·기간 제한 없음, 토큰 유지 | `UserService.changeNickname` |
| 닉네임 변경의 동시 처리 | 비밀번호 비교는 트랜잭션 밖. 저장할 때 회원 행을 잠그고 다시 확인해 그 사이 비밀번호 변경·탈퇴·정지가 있었으면 401 | `UserService.changeNickname` |

## 2. 토큰

| 규칙 | 값 | 코드 위치 |
|---|---|---|
| Access Token | JWT, 15분 | `JwtTokenProvider.ACCESS_TOKEN_VALIDITY_SECONDS` |
| Refresh Token | 90일, 원문은 응답으로만 주고 DB에는 SHA-256 해시 | `jwt.refresh-token-validity-in-seconds`, `RefreshToken` |
| 회전 | 재발급하면 이전 Refresh Token 즉시 폐기 | `UserService.refresh` |
| 재사용 감지 | **재발급으로 교체된** Refresh Token이 다시 오면 그 사용자의 Refresh Token 전부 삭제 + `token_version` 증가 | `UserService.refresh` |
| 무효화된 토큰 | 로그아웃하거나 일괄 무효화된 Refresh Token은 DB에서 삭제. 다시 와도 401만 내고 다른 세션은 유지 | `UserService.logout`, `UserService.invalidateSessions` |
| 동시 처리 | 로그인·재발급·로그아웃·일괄 무효화·탈퇴·닉네임 변경은 회원 행을 먼저 잠금. 같은 토큰으로 재발급이 겹치면 나중 요청은 재사용으로 처리 | `UserRepository.findByIdForUpdate` |
| 즉시 무효화 | 비밀번호 변경·재설정, 전체 로그아웃, 재사용 감지 시 `token_version` 증가. 필터가 JWT 값과 DB 값을 비교해 다르면 401 | `TokenVersionChecker`, `JwtAuthenticationFilter` |
| 단일 로그아웃 | 그 Refresh Token만 삭제. Access Token은 최대 15분 유효 | `UserService.logout` |
| 서명 키 | 환경변수 `JWT_SECRET` | `application.properties` |

## 3. 로그인·비밀번호 재설정 제한

| 규칙 | 값 | 코드 위치 |
|---|---|---|
| 기준 | 이메일 + 클라이언트 IP (재설정 요청은 이메일별 제한도 함께 적용) | `LoginAttemptLimiter` |
| 로그인 | 15분 안에 5번 실패하면 15분 잠금 (429). 1~4번째는 401이며 계정 존재 여부를 구분하지 않음 | `LoginAttemptLimiter.MAX_ATTEMPTS`·`WINDOW`·`LOCK` |
| 재설정 요청 | 15분 안에 5번까지는 가입 여부와 관계없이 204, 6번째부터 15분 동안 429 | `LoginAttemptLimiter.consumePasswordResetRequest` |
| 재설정 요청 (이메일별) | 첫 요청부터 1시간 구간에 10번까지, 10번째부터 1시간 동안 IP와 관계없이 429. 이메일+IP 제한으로 거절된 요청은 세지 않음. 로그인과 이미 받은 링크는 막지 않음 | `LoginAttemptLimiter.MAX_RESETS_PER_EMAIL`·`EMAIL_RESET_WINDOW`·`EMAIL_RESET_LOCK` |
| 동시 요청 | 기록 행을 `on conflict do nothing`으로 만들고 잠근 뒤 횟수를 올림 | `AuthAttemptRepository` |
| 타이밍 공격 방지 | 없는 이메일도 더미 해시로 비밀번호 비교 | `UserService.DUMMY_PASSWORD_HASH` |
| 트랜잭션 | 조회 → 비밀번호 비교(트랜잭션 밖) → 토큰 발급. 발급 때 회원을 잠그고 비밀번호·정지를 다시 확인. 실패 횟수는 따로 저장돼 로그인이 거절돼도 남음 | `UserService.login` |

## 4. 비밀번호 재설정

| 규칙 | 값 | 코드 위치 |
|---|---|---|
| 토큰 유효 | 15분, 1회용 | `UserService.PASSWORD_RESET_TOKEN_MINUTES` |
| 메일 | Gmail SMTP, 비밀번호 `MAIL_PASSWORD` | `SmtpPasswordResetNotifier` |
| 발송 순서 | 새 토큰 저장 → 메일 발송(트랜잭션 밖) → 먼저 만든 토큰 무효화. 발송에 실패하면 새 토큰만 지우고 이전 링크는 유지 | `UserService.requestPasswordReset` |
| 링크 주소 | `app.public-base-url` + `/email/reset?token=…` | `EmailPageController` |
| 성공 후 | 모든 토큰 무효 | `UserService.resetPassword` |

## 5. 회원 탈퇴

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 확인 | 현재 비밀번호 필요 | `WithdrawRequest` | ✅ |
| 다른 도메인 데이터 | 같은 트랜잭션에서 review·reward·dday·reading 리스너가 먼저 삭제 | `UserWithdrawnEvent` | ✅ |
| 로그인·재설정 제한 기록 | 같은 트랜잭션에서 그 이메일의 기록을 모든 IP에 대해 삭제. 탈퇴 뒤 같은 이메일로 다시 시도하면 새로 기록 | `LoginAttemptLimiter.deleteAllOf` | ✅ |

## 6. 관리자

관리자 API는 [api.md](./api.md#관리자-api). 스펙 [007](../../specs/007-admin-users/).

| 규칙 | 값 | 코드 위치 | 상태 |
|---|---|---|---|
| 권한 | `/api/admin/**`는 `ADMIN`만 (아니면 403) | `SecurityConfig` | ✅ |
| 첫 관리자 | API로 만들 수 없음. DB에서 `users.role`을 직접 `ADMIN`으로 | — | ✅ |
| 정지 판단 | `status = SUSPENDED`이고 끝 시각이 없거나 지금보다 뒤일 때만 정지. 끝 시각이 지나면 해제하지 않아도 풀림 (스케줄러 없음). `status`가 NULL이면 ACTIVE | `User.isSuspendedAt` | ✅ |
| 정지 시 세션 | `token_version` +1, Refresh Token 전부 삭제 (전체 로그아웃과 같음) | `UserService.invalidateSessions` | ✅ |
| 정지된 회원 로그인 | 비밀번호가 맞을 때만 403 `ACCOUNT_SUSPENDED` + 끝 시각. 틀리면 401 (정지 사실을 드러내지 않음) | `UserService.login` | ✅ |
| 정지된 회원 재설정 | 비밀번호 재설정 요청·재설정 가능. 정지는 그대로 | `UserService` | ✅ |
| 정지된 회원의 글 | 정지 중에만 공개 한줄평·커뮤니티에서 숨김 ([review/rules](../review/rules.md#5-완독자-커뮤니티)) | `CommunityQueryRepository`·`ReviewRepository` | ✅ |
| 정지 사유 | 선택, 200자까지. 관리자 상세에서만 보임 | `User.MAX_SUSPENSION_REASON_LENGTH` | ✅ |
| 다시 정지 | 사유·끝 시각·정지 시각·관리자를 새 값으로 | `User.suspend` | ✅ |
| 역할 변경 | 바뀌면 세션 무효화 (다시 로그인해야 새 역할). 같은 역할이면 아무것도 안 함 | `UserAdminService.changeRole` | ✅ |
| 관리자 보호 | 자기 자신·ADMIN 대상의 정지·역할 변경은 400. 해제는 ADMIN에게도 가능 | `UserAdminService` | ✅ |
| 정지 이력 | 마지막 정지 정보만 남김. 해제하면 지움 | `User.unsuspend` | ✅ |
