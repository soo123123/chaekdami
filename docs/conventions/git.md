> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# git 규칙

## 브랜치

| 브랜치 | 용도 |
|---|---|
| `main` | 팀 공용 기준. PR로만 병합 |
| `feature/<파트>-<기능>` | 기능 개발 (예: `feature/fe1-library-room`) |
| `fix/<파트 또는 주제>` | 수정·통합 작업 (예: `fix/fe1`, `fix/integration2`) |
| `docs/<주제>` | 문서 작업 (예: `docs/harness`) |

스펙으로 진행하는 작업은 브랜치 이름에 스펙 번호를 넣으면 찾기 쉽다. 예: `feature/003-session-sentence`

## 커밋 메시지

원본 규칙: `.cursor/rules/commit-message.mdc`

```
feat: 회원가입 및 로그인 기본 API 구현
- 유저 엔티티 및 리포지토리 설정
- 회원가입 API 구현 및 DTO 검증 추가
- 이메일 전송은 추후 추가 필요
```

- 첫 줄은 `타입: 요약`. 타입은 `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `merge` 등.
- 다음 줄부터 `- `로 시작하는 항목. 한 줄에 한 가지.
- 제목과 항목은 명사로 끝낸다 (`구현`, `추가`, `설정`). `~한다`, `~했다`로 끝내지 않는다.
- 나중에 할 일은 목록에 명시한다.
- 공동 작성자 줄(`Co-authored-by`)을 넣지 않는다.

## PR 체크리스트

```md
- [ ] 관련 스펙: docs/specs/NNN-... (스펙 대상이 아니면 "해당 없음")
- [ ] API·DB·규칙이 바뀌었으면 docs/domains/* 반영
- [ ] 백엔드 테스트 통과 (cd backend && ./gradlew test)
- [ ] scripts/harness/contract-check.py 결과 확인
- [ ] 비밀값(키·비밀번호)이 커밋에 없음
```

## 올리면 안 되는 것

- 비밀값이 들어간 파일 (`.env`, 실제 값이 든 properties)
- 개발용 임시 스크립트 (`frontend/scripts/skip-reading.mjs` — 파일 안에 "커밋하지 말 것" 표시)
- 빌드 결과물 (`build/`, `.gradle/`, `node_modules/`)
