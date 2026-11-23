> 기준: fix/fe1@ef397a6 · 최종 확인: 2026-11-22 · 담당: BE1

# git 규칙

## 브랜치

| 브랜치 | 용도 |
|---|---|
| `main` | 팀 공용 기준. PR로만 병합 (예외: `docs/known-issues.md`는 main에 바로 push — 아래 "known-issues 올리기") |
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

## known-issues 올리기

문제·할 일·질문 목록(`docs/known-issues.md`)은 팀이 같은 내용을 바로 봐야 해서 **PR 없이 main에 바로 올린다** ([decisions/0008](../decisions/0008-known-issues-on-main.md)).

| 하는 일 | 명령 |
|---|---|
| 지난 확인 이후 바뀐 것만 보기 | `python3 scripts/harness/known-issues.py news` (처음 한 번 `python3 scripts/harness/known-issues.py part BE1`로 내 파트를 정하면 내 파트 먼저) |
| 최신 목록 보기 | `python3 scripts/harness/known-issues.py show` |
| 고칠 준비 (main 작업 공간을 최신으로) | `python3 scripts/harness/known-issues.py open` → `.worktrees/known-issues/docs/known-issues.md`를 고친다 |
| 올리기 | `python3 scripts/harness/known-issues.py push -m "docs: TODO-N 완독 보상 기록"` |

| 건드릴 파일 겹침 확인 | `python3 scripts/harness/known-issues.py overlap --design docs/specs/NNN-.../design.md` |

- known-issues 맨 위 **"🚧 진행 중 작업"** 표에는 스펙마다 건드리는 파일(design ③)이 있다. design이 승인되면 등록하고, PR이 병합되면 지운다. 새 작업을 시작하기 전에 겹침을 확인하고, 겹치면 담당자끼리 순서를 정한다.
- 이 파일 하나만 바꾼 커밋만 올라간다. 다른 사람이 먼저 올렸으면 스크립트가 받아서 다시 쌓고, 같은 ID가 생기면 멈춘다.
- **기능 브랜치에서는 `docs/known-issues.md`를 고치지 않는다.** 고치면 PR 병합 때 충돌한다 (`docs-check`가 잡는다). 브랜치를 main에 맞추면 최신 목록이 저절로 들어온다.
- 도메인 문서의 ID 표시 줄(`> ⏳ [TODO-N](...)`)은 평소처럼 브랜치·PR로 들어간다.
- 직접 고칠 때(Cursor 등)도 같다: main을 받은 뒤 이 파일만 고쳐 main에 커밋·push 한다.

## 올리면 안 되는 것

- 비밀값이 들어간 파일 (`.env`, 실제 값이 든 properties)
- 개발용 임시 스크립트 (`frontend/scripts/skip-reading.mjs` — 파일 안에 "커밋하지 말 것" 표시)
- 빌드 결과물 (`build/`, `.gradle/`, `node_modules/`)
