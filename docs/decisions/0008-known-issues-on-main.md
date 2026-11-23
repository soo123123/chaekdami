> 기준: feature/003-session-sentence · 최종 확인: 2026-11-23 · 담당: BE1

# 0008 · known-issues는 main에서만 고치고 바로 push

- 상태: 채택 · 2026-11-23 · 결정: BE1

## 예전 설계
`docs/known-issues.md`도 다른 문서처럼 작업 브랜치에서 고치고 PR로 main에 병합했다. AI는 커밋·push를 하지 않았다 ([0007](./0007-hooks-skills.md), AGENTS 7장).

## 바꾼 이유
- 문제·할 일·질문은 파트끼리 나눠 맡는 목록이라, 한 사람이 기록하면 다른 파트가 **바로** 봐야 한다. PR 병합을 기다리면 각자 브랜치마다 다른 목록을 보게 된다.
- 여러 브랜치가 같은 표를 고치면 병합할 때 줄 충돌과 ID 중복이 생긴다.
- GitHub Issues로 옮기는 방법도 검토했지만, 문서 안 ID 링크·검사 스크립트를 모두 바꿔야 해서 지금 방식을 유지하는 쪽을 택했다.

## 지금 방식
- known-issues는 **main에서만** 고친다. `scripts/harness/known-issues.py`가 main 작업 공간(`.worktrees/known-issues/`, origin/main 기준 git worktree)을 관리한다.
  - `show` 최신 목록 · `open` 작업 공간 준비 · `push -m` 커밋하고 main에 push · `discard` 버리기
- **예외 허용**: 이 파일 하나만 바뀐 커밋은 PR 없이 main에 push하고, AI도 사람 확인 없이 이 스크립트로 push한다. 다른 커밋·push·병합은 그대로 사람이 한다.
- 브랜치는 known-issues를 고치지 않는다. hook(H3)이 막고, `docs-check`가 브랜치 변경을 문제로 알린다. 브랜치의 ID 표시 줄은 origin/main의 ID도 인정한다.
- 동시에 올리면 스크립트가 최신 main 위로 다시 쌓는다. 같은 줄을 고쳤거나 ID가 겹치면 멈추고 다시 `open`하게 한다.
- 해결 처리는 고친 코드가 main에 병합된 뒤에 한다. 그 전에는 `진행 중 (스펙 NNN)`.
- **건드리는 곳 공유**: known-issues 맨 위 "🚧 진행 중 작업" 표에 스펙마다 design ③의 수정할 파일을 적는다 (design 승인 때 등록, 설계 변경 때 갱신, 병합 때 삭제). 스펙의 design·tasks는 브랜치 안에 있어 다른 사람이 못 보지만, 이 표는 main에 바로 올라가 실시간으로 보인다. `known-issues.py overlap`이 새 스펙의 design ③과 이 표를 비교해 겹치는 작업을 알려준다.
  - Draft PR로 공유하는 방법도 검토했다. 브랜치 push가 필요하고 `gh` 로그인이 있어야 비교할 수 있어서, main의 표 하나만 읽는 이 방식을 택했다.
  - 한계: 스펙 없는 작업은 적지 않으면 보이지 않는다. 계획(design) 기준이라 구현 중 늘어난 파일은 갱신 전까지 안 보인다. 겹치면 알려줄 뿐, 순서는 담당자가 정한다.
- **새 소식 알림**: 최신 목록을 읽을 수 있어도 무엇이 새로 바뀌었는지는 알 수 없었다. `known-issues.py news`가 지난 확인 이후 main에서 바뀐 항목(새로 생김·해결·칸 변경·빠짐·진행 중 작업 시작/갱신/끝)을 요약하고 내 파트 항목을 먼저 보여준다. Claude Code는 세션 시작 hook(H4)이 자동으로 실행하고, 스킬(issue-log·new-spec·spec-next)과 Cursor 규칙도 작업 시작 전에 확인한다. 확인 시점과 파트는 각자 컴퓨터에만 저장한다.
- **작업 중 범위 확인**: 등록한 건드리는 곳은 계획이라 작업 중 실제와 달라질 수 있다 (설계 밖 파일 수정, 표에 없는 작업이 같은 파일 수정, 작업하는 동안 main이 먼저 바뀜). `known-issues.py drift`가 스펙 브랜치에서 ① 실제로 바뀐 파일 중 등록 범위 밖인 것 ② 브랜치가 갈라진 뒤 main에서 바뀐 내 파일을 알려준다. `spec-next`가 작업마다·PR 전에 돌리고, 세션 시작 hook(H4)도 돌린다. 계획된 문서 수정(design ④)과 자기 스펙 폴더는 범위 밖으로 보지 않는다.
  - 한계: 표에 없는 작업이 같은 파일을 고치는 것은 main에 병합된 뒤에야(②로) 보인다.

## 영향
- 사용법: [conventions/git.md](../conventions/git.md#known-issues-올리기), [conventions/harness.md](../conventions/harness.md)
- 바뀐 도구: `known-issues.py`(새로 추가, `paths`·`overlap`·`news`·`part`·`drift` 포함), `session-news.py`(H4, 새로 추가), `guard-git.py`(`merge-base` 오탐 수정), `guard-files.py`, `check-after-edit.py`, `docs-check.py`, skills `issue-log`·`spec-next`·`docs-sync`·`new-spec`
- main에 브랜치 보호 규칙을 켜면 이 push가 막힌다. 켤 때는 이 파일 예외를 함께 정한다.
- 이 규칙은 이 변경이 main에 병합된 뒤부터 모든 브랜치에 적용된다. 그 전에 known-issues를 고친 브랜치는 PR 전에 main 버전으로 되돌린다.
