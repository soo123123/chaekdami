> 기준: main@82df578 + 스펙 004 · 최종 확인: 2026-11-22 · 담당: BE1

# 하네스 도구 — hooks · skills · 검사 스크립트

AI(Claude)가 이 저장소 규칙([AGENTS.md](../../AGENTS.md))을 지키도록 돕는 도구 모음이다. 규칙 자체는 AGENTS.md와 [specs/README.md](../specs/README.md)에 있고, 여기 도구는 그 규칙을 **자동으로 검사하거나 절차로 묶은 것**이다. 새 규칙을 만들지 않는다.

| 종류 | 위치 | 적용 대상 |
|---|---|---|
| hooks | `.claude/settings.json`, `.claude/hooks/` | Claude Code (저장소를 열면 자동 적용) |
| skills | `.claude/skills/<이름>/SKILL.md` | Claude Code |
| 검사 스크립트 | `scripts/harness/` | 누구나 직접 실행 가능 |
| Cursor 규칙 | `.cursor/rules/` | Cursor (hooks·skills 없음) |

개인 설정은 `.claude/settings.local.json`에 둔다 (git 제외).

## 1. hooks — 자동 검사와 금지

| # | 언제 | 하는 일 | 결과 | 근거 |
|---|---|---|---|---|
| H1 | Claude가 문서(`docs/`, `AGENTS.md` 등)나 API 관련 파일(백엔드 `*Controller.java`, 프론트 `api/*.ts`, `constants/*.ts`)을 고친 직후 | `docs-check`, (API 파일이면) `contract-check` 실행 | 문제가 있을 때만 Claude에게 알림. **막지 않음** | AGENTS 5장 |
| H2 | Claude가 셸 명령을 실행하기 전 | `git commit` · `git push` · `git merge` · `gh pr merge` 차단 (`git merge-base` 같은 조회 명령은 통과). `known-issues.py push`는 막지 않음 | 막고 사용자에게 명령을 안내하게 함 | AGENTS 7장 |
| H4 | Claude Code 세션을 시작·재개할 때 | `known-issues.py news --quiet`, `drift --quiet` 실행 | main의 known-issues가 지난 확인 이후 바뀌었으면 알려줌 (내 파트 먼저). 지금 브랜치가 스펙 작업이면 등록 범위 밖 수정과 main에서 먼저 바뀐 내 파일도 알려줌. 알릴 것이 없거나 네트워크가 안 되면 조용히 넘어감. **막지 않음** | AGENTS 4장 |
| H3 | Claude가 파일을 쓰기 전 | `frontend/ios·android/`, `.env` 류 비밀 파일 차단 / 브랜치의 `docs/known-issues.md` 차단(main 작업 공간에서 고치게 함) / 승인 이후 스펙의 requirements·design 수정은 **사람에게 확인** | 막거나 확인 창 | AGENTS 4·6·7장, S11 |

- 스크립트: `guard-git.py`(H2), `guard-files.py`(H3), `check-after-edit.py`(H1), `session-news.py`(H4), 공통 `_hook.py`
- H4의 "지난 확인 시점"과 내 파트는 이 컴퓨터의 `.git/` 안(`known-issues-seen`, `git config chaekdami.part`)에만 저장된다. 커밋되지 않는다.
- H1은 처음에 "알려주기만" 한다. `contract-check`에 이미 아는 불일치(독서 인증 옛 주소, 해결됨)가 있어서였다. 스펙 004로 불일치가 0건이 됐으니 막는 방식으로 올릴지 정한다.
- H1은 main 작업 공간의 known-issues(`.worktrees/known-issues/`)를 고쳤을 때 그 작업 공간 기준으로 `docs-check`를 돌린다.
- H2 때문에 Claude는 커밋하지 않는다. 예외는 known-issues 한 파일뿐이다 (`known-issues.py`가 이 파일만 바뀐 경우에만 커밋·push한다). 대신 커밋할 파일과 메시지([git.md](./git.md) 형식)를 제안한다. AI 커밋을 허용하려면 `guard-git.py`에서 `commit`을 빼고 AGENTS 7장을 함께 고친다.

## 2. skills — 반복 작업 절차

Claude에게 아래처럼 말하면 해당 skill을 따른다. `/이름`으로 직접 부를 수도 있다.

| 이름 | 이렇게 말하면 | 하는 일 |
|---|---|---|
| `new-spec` | "새 스펙: ○○" | 스펙 필요 여부 판단 → 다음 번호 → requirements 작성 → 목록 추가 → ✋ 확인 요청 → design + 겹침 확인 → ✋ → 진행 중 작업 등록 |
| `spec-next` | "스펙 004 다음 작업" | 승인 확인 → 겹침 확인 → tasks 첫 미완료 작업 구현·검증·체크 → 범위 확인(drift) → 설계와 다르면 멈추고 보고 → 마지막에 docs 반영 |
| `docs-sync` | "PR 확인해줘", "병합했으니 문서 맞춰줘" | 병합 전 PR 확인(대상 브랜치·충돌·영향) / 병합 후 바뀐 코드를 `docs/domains`에 반영 |
| `issue-log` | "todo 보여줘", "문제로 기록해줘", "문제점 알려줘", "내 파트 할 일", "TODO-N·ISSUE-N 시작할게", "TODO-N·ISSUE-N 끝났어" | 최신 main에서 문제 → 할 일 → 질문 조회 / 분류 → ID 붙여 main 작업 공간에 기록 → main에 바로 push → 도메인 문서에 표시 줄 / 시작(기간 묻기)·완료(병합 후)를 노션에도 반영 (할 일은 총괄 보드, 문제는 문제 보드) |

## 3. 검사 스크립트

| 명령 | 하는 일 |
|---|---|
| `python3 scripts/harness/docs-check.py` | 상태 줄, 링크, 문서에 빠진 API, 비밀값, 문제 ID 연결(origin/main ID 포함), 브랜치가 known-issues를 고쳤는지 |
| `python3 scripts/harness/known-issues.py show·open·push·discard` | known-issues를 main 작업 공간에서 고치고 바로 main에 올림 ([git.md](./git.md#known-issues-올리기)) |
| `python3 scripts/harness/known-issues.py news·part` | 지난 확인 이후 바뀐 것 요약 / 내 파트 저장 |
| `python3 scripts/harness/known-issues.py drift` | 스펙 브랜치가 등록한 건드리는 곳 밖을 고쳤는지, 갈라진 뒤 main에서 내 파일이 먼저 바뀌었는지 |
| `python3 scripts/harness/known-issues.py paths·overlap` | design ③ 경로 뽑기 / "🚧 진행 중 작업" 표와 건드릴 파일 겹침 확인 |
| `python3 scripts/harness/contract-check.py` | 앱이 부르는 `/api` 경로가 백엔드에 있는지 (`--all`: 앱이 안 쓰는 API도) |

## 4. 막혔을 때

| 상황 | 할 일 |
|---|---|
| Claude가 커밋·push를 못 한다고 함 | 정상이다. 제안한 명령을 직접 실행한다 (known-issues만 예외) |
| 세션 시작 알림을 다시 보고 싶음 | `python3 scripts/harness/known-issues.py news`는 확인 시점을 옮기므로 같은 소식은 다시 나오지 않는다. 전체는 `show` |
| known-issues push가 "먼저 고쳤다"며 멈춤 | 다른 사람이 동시에 올렸다. `open` → 번호·내용 다시 맞추기 → `push` |
| docs-check가 "known-issues 위치"를 알림 | 브랜치에서 known-issues를 고쳤다. `git checkout origin/main -- docs/known-issues.md`로 되돌리고 수정은 main 작업 공간에서 다시 한다 |
| 승인된 스펙 수정 확인 창이 뜸 | 내가 수정 방향을 준 게 맞으면 허용, 아니면 거절 |
| H1이 이미 아는 불일치를 계속 알림 | 정상이다. known-issues에 있는 항목이면 무시해도 된다 |
| hook을 잠시 끄고 싶음 | `.claude/settings.local.json`에 `"disableAllHooks": true` (커밋하지 않는다) |
| hook 스크립트 오류 | `python3`가 있는지 확인. 스크립트는 표준 라이브러리만 쓴다 |

## 5. 바꾸는 법

hooks·skills는 작업 도구라 스펙 없이 고친다 ([decisions/0007](../decisions/0007-hooks-skills.md)). 고칠 때는 이 문서도 함께 고치고, 팀 작업 방식이 바뀌면 decisions에 이유를 남긴다.
