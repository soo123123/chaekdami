> 상태: done · 작성: 2026-11-25 · 기준: feature/be3-nickname@9353974 · 담당: BE3 · 승인: BE3
> 요구사항: [requirements.md](./requirements.md)

# 010 · 닉네임 변경 API — Design

## ① 흐름

```
[앱] ── PATCH /api/me {nickname} ──▶ 필터(토큰 확인, 401: R2.1) ─▶ UserController ─▶ UserService.changeNickname

UserService.changeNickname (바깥 트랜잭션 없음)
  1. 형식 검사 (NicknameRules, 400: R2.2)
  2. [트랜잭션 1] 현재 사용자의 id·비밀번호 해시 조회 → 없으면 401
  3. 비밀번호와 비교 (BCrypt, DB 연결 없음: R3.1) → 같으면 400 (R2.4)
  4. [트랜잭션 2] 회원 행 잠금 (findByIdForUpdate)
       ├ 회원이 없거나, 해시가 2와 다르거나, 정지 중이면 401 (R3.2)
       ├ 다른 회원이 쓰는 닉네임이면 409 (R2.3)
       └ 닉네임 저장 → 내 정보 반환 (R1.1)
  5. 트랜잭션 2가 UNIQUE 위반으로 실패하면 409 (R2.5)
```

## ② 바뀌는 것

| 구분 | 변경 | 관련 R |
|---|---|---|
| API | `PATCH /api/me` 추가. 요청 `{"nickname": "…"}`, 응답 200 `UserResponse`(`id`, `email`, `nickname`, `role`). 오류 400 `VALIDATION_ERROR`, 401 `UNAUTHORIZED`, 409 `NICKNAME_ALREADY_EXISTS` (모두 기존 코드) | R1.1, R2 |
| DB | 테이블·컬럼 변경 없음. `User`에 `@DynamicUpdate`를 붙여 UPDATE가 **바뀐 컬럼만** 쓴다 | R3.3 |
| 비즈니스 규칙 | 닉네임 변경 규칙 추가: 가입과 같은 규칙, 같은 닉네임은 성공, 토큰 유지, 횟수·기간 제한 없음 | R1.2, R1.3, R2 |

- `@DynamicUpdate`가 필요한 이유: 지금은 비밀번호 변경·정지가 회원의 모든 컬럼을 다시 쓴다. 닉네임 변경과 겹치면 먼저 읽은 옛 닉네임으로 되돌릴 수 있다. 이 변경은 회원을 고치는 다른 기능의 UPDATE 문에도 적용된다.
- 커뮤니티는 작성자 닉네임을 조회할 때 `users`에서 읽으므로 고칠 것이 없다 (R1.4).
- `NicknameChanger` 인터페이스는 부르는 곳이 없어 지우고, `UserService.changeNickname`이 현재 사용자의 닉네임만 바꾼다.

## ③ 수정할 파일

| 파일 | 변경 내용 |
|---|---|
| `backend/src/main/java/com/chaekdami/user/presentation/UserController.java` | `PATCH /api/me` 추가 |
| `backend/src/main/java/com/chaekdami/user/presentation/dto/ChangeNicknameRequest.java` | 새 파일. `@NotBlank`, `@NicknamePolicy` |
| `backend/src/main/java/com/chaekdami/user/application/UserService.java` | `changeNickname` 트랜잭션 분리, 반환값 추가 |
| `backend/src/main/java/com/chaekdami/user/application/NicknameChanger.java` | 삭제 |
| `backend/src/main/java/com/chaekdami/user/infrastructure/UserRepository.java` | 회원 번호로 `LoginCredential` 조회 |
| `backend/src/main/java/com/chaekdami/user/domain/User.java` | `@DynamicUpdate` |
| `backend/src/test/java/com/chaekdami/user/application/ChangeNicknameTest.java` | 새 파일. H2로 API·규칙·동시 처리 확인 |
| `backend/http/auth.http` | 요청 예시 |

## ④ 고칠 docs 문서

- [x] `docs/domains/user/api.md` — `PATCH /api/me`
- [x] `docs/domains/user/rules.md` — 닉네임 변경 규칙, 동시 처리
- [x] `docs/domains/user/data.md` — 바뀐 컬럼만 쓰는 UPDATE
- [x] `docs/domains/user/overview.md` — 기능 목록, `NicknameChanger` 삭제
- [ ] `docs/known-issues.md` — 병합 뒤 TODO-34를 남은 앱 작업(FE2)으로 고침 (main에서)

## ⑤ 남은 질문 (❓)

- 없음

---

## 변경 기록

| 날짜 | 바뀐 내용 | 이유 | 결정 |
|---|---|---|---|
| | | | |
