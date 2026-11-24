> 상태: done · 작성: 2026-11-25 · 기준: feature/be3-request-limits@71e4030 · 담당: BE3
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# 011 · 신고·비밀번호 재설정 요청 제한 — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. 끝난 작업은 체크한다.
- 작업 하나는 한 번에 끝나고 바로 검증할 수 있는 크기로 쪼갠다.
- 설계와 다르게 해야 하면 멈추고 보고한다. (S10)

## 1. 재설정 제한

- [x] 1.1 `AuthAttemptRepository` 행 만들기·잠금 조회, `LoginAttemptLimiter` 이메일별 제한 — R2.1~R2.7
      검증: `PasswordResetLimitTest`, `LoginAttemptLimiterTest`, `UserServiceLoginAttemptTest`
- [x] 1.2 탈퇴 때 이메일별 기록 삭제 확인 — R2.8
      검증: `WithdrawAuthAttemptsTest`

## 2. 신고 제한

- [x] 2.1 `UserLock`·`UserRepositoryLock`, `ReviewReportRepository` 오늘 신고 수, `ReviewErrorCode.TOO_MANY_ATTEMPTS`, `ReviewSocialService.report` — R1
      검증: `ReviewReportLimitTest`, `ReviewSocialServiceTest`

## 9. 마무리

- [x] 9.1 전체 테스트 — 검증: `cd backend && ./gradlew test`
- [x] 9.2 계약 검사 — 검증: `python3 scripts/harness/contract-check.py`
- [x] 9.3 **docs 반영**: design ④의 `docs/domains/` 문서 수정 — 검증: `python3 scripts/harness/docs-check.py`
- [x] 9.4 상태 줄을 done으로, `docs/specs/README.md` 목록 갱신
