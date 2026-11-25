> 상태: done · 작성: 2026-11-25 · 기준: feature/be3-nickname@9353974 · 담당: BE3
> 요구사항: [requirements.md](./requirements.md) · 설계: [design.md](./design.md)

# 010 · 닉네임 변경 API — Tasks

**진행 규칙**
- 위에서부터 순서대로 한다. 끝난 작업은 체크한다.
- 작업 하나는 한 번에 끝나고 바로 검증할 수 있는 크기로 쪼갠다.
- 설계와 다르게 해야 하면 멈추고 보고한다. (S10)

## 1. 서비스

- [x] 1.1 `User`에 `@DynamicUpdate` — R3.3
      검증: `ChangeNicknameTest`
- [x] 1.2 `UserService.changeNickname` 트랜잭션 분리, `UserRepository.findCredentialById`, `NicknameChanger` 삭제 — R1.1~R1.3, R2.2~R2.6, R3
      검증: `ChangeNicknameTest`

## 2. API

- [x] 2.1 `PATCH /api/me`, `ChangeNicknameRequest` — R1.1, R2.1, R2.2
      검증: `ChangeNicknameTest`
- [x] 2.2 `backend/http/auth.http` 요청 예시 — R4.1
      검증: 파일 확인

## 3. 테스트

- [x] 3.1 `ChangeNicknameTest` — R1.1~R1.3, R2, R3
      검증: `cd backend && ./gradlew test --tests "*ChangeNicknameTest"`
- [x] 3.2 커뮤니티가 작성자 닉네임을 `users`에서 읽는지 코드 확인 — R1.4
      검증: `CommunityQueryRepository`, `UserRepositoryNicknameReader`

## 9. 마무리

- [x] 9.1 전체 테스트 — 검증: `cd backend && ./gradlew test`
- [x] 9.2 계약 검사 — 검증: `python3 scripts/harness/contract-check.py`
- [x] 9.3 **docs 반영**: design ④의 `docs/domains/user/` 문서 수정 — 검증: `python3 scripts/harness/docs-check.py`
- [x] 9.4 상태 줄을 done으로, `docs/specs/README.md` 목록 갱신
