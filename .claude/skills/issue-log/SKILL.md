---
name: issue-log
description: 책다듬이의 문제점·남은 일·결정할 것을 기록하거나 찾을 때 쓴다. "이거 문제로 기록해줘", "문제점 알려줘", "남은 일 뭐 있어", "결정할 것 정리해줘", "내 파트 할 일", 작업 중 버그·한계·미정 사항을 발견했을 때.
---

# 문제·할 일·질문 기록과 찾기

유일한 목록: `docs/known-issues.md`. 규칙 원문은 그 문서 위쪽과 `AGENTS.md` 4장.

**known-issues는 main에서만 고치고 바로 main에 올린다** ([decisions/0008](../../../docs/decisions/0008-known-issues-on-main.md)).
브랜치에 있는 `docs/known-issues.md` 사본은 오래됐을 수 있으니 읽지도 고치지도 않는다 (고치면 hook이 막는다).

| 명령 | 하는 일 |
|---|---|
| `python3 scripts/harness/known-issues.py news` | 지난 확인 이후 main에서 바뀐 것만 요약 (내 파트 먼저), 확인 시점 갱신 |
| `python3 scripts/harness/known-issues.py part BE1` | 내 파트를 이 컴퓨터에만 저장 |
| `python3 scripts/harness/known-issues.py show` | origin/main을 받아 최신 목록 출력 |
| `python3 scripts/harness/known-issues.py open` | main 작업 공간(`.worktrees/known-issues/`)을 최신으로 맞추고 고칠 파일 경로 출력 |
| `python3 scripts/harness/known-issues.py push -m "docs: 요약"` | 그 파일 수정만 커밋해 main에 push (사람 확인 없이 AI가 실행해도 된다) |
| `python3 scripts/harness/known-issues.py discard` | 작업 공간 수정 버리기 |
| `python3 scripts/harness/known-issues.py paths --design <design.md>` | design ③ 경로를 "건드리는 곳" 칸 형식으로 출력 |
| `python3 scripts/harness/known-issues.py overlap --design <design.md>` (또는 `overlap <경로...>`) | 최신 main의 "🚧 진행 중 작업"과 겹치는 곳 출력 |

## 찾기

1. 먼저 `python3 scripts/harness/known-issues.py news`로 **지난 확인 이후 바뀐 것**을 맨 위에 보여준다 (없으면 "새 소식 없음" 한 줄)
   - 파트를 모르면 사용자에게 한 번 묻고 `part`로 저장한다
2. 그다음 `show`로 최신 목록을 읽어 요청한 것을 보여준다

| 요청 | 할 일 |
|---|---|
| "문제점 알려줘" | 1장 + `grep -rn "ISSUE-" docs/`로 문서 안 위치까지 |
| "남은 일" | 2장 + `grep -rn "TODO-" docs/` |
| "결정할 것" | 3장 + `grep -rn "ASK-" docs/` |
| "내 파트(BE1 등) 할 일" | 담당 칸에 그 파트가 있는 행만 (주 담당 먼저, `(+파트)` 협업은 따로) |

심각도·상태 순으로 정리해 보여준다. 도메인 문서 표시(grep)는 지금 브랜치 기준이라 main보다 늦을 수 있다.

## 기록

1. `open`으로 작업 공간을 최신으로 맞춘다
2. **분류**: "지금 쓰면 잘못된 결과가 나오거나 위험한가?"
   - 그렇다 → ⚠️ 문제 `ISSUE-<SEC|BUG|DATA|LIMIT>-N`
   - 아직 없어서 못 쓸 뿐 → ⏳ 할 일 `TODO-N` (기능 / 개선 표를 고른다)
   - 사람이 정해야 함 → ❓ 질문 `ASK-N`
   - 애매하면 질문으로 올린다
3. **번호**: 작업 공간 파일에서 같은 종류의 가장 큰 번호 + 1 (`grep -o "ISSUE-BUG-[0-9]*" .worktrees/known-issues/docs/known-issues.md | sort -V | tail -1`). 한 번 붙인 ID는 바꾸지 않는다
4. **행 추가**: 작업 공간 파일(`.worktrees/known-issues/docs/known-issues.md`)에 해당 표 형식 그대로. 행 앞에 `<a id="소문자-id"></a>`. 모든 표에 담당(주 담당 파트, 함께 할 파트는 `(+FE1)`)을 쓴다. 문제는 담당·심각도(높음·중간·낮음)·상태(열림)·지금 구현·문제·위치·문서·스펙. 맨 위 `최종 확인` 날짜도 고친다
5. **push**: `push -m "docs: <ID> <짧은 요약> 기록"`. 다른 사람이 먼저 같은 번호를 올렸다고 나오면 `open` → 번호를 다시 붙이고 → 다시 push
6. **도메인 문서 표시**: 지금 브랜치의 관련 위치 바로 아래에 한 줄만 `> ⚠️ [ISSUE-BUG-3](../../known-issues.md#issue-bug-3) — 짧은 설명` (할 일 ⏳, 질문 ❓). 이 줄은 브랜치 작업과 함께 PR로 들어간다
7. **심각도 높음**이면 기록 직후 사용자에게 바로 알린다
8. `python3 scripts/harness/docs-check.py`로 ID 연결 확인 (origin/main의 ID도 인정한다)

## 🚧 진행 중 작업 표 (건드리는 곳)

- 스펙 design이 승인되면 한 줄 등록 (new-spec 7단계). 칸: 스펙 · 대상 ID · 담당 · 브랜치 · 건드리는 곳(백틱 경로, 쉼표로) · 갱신 날짜
- "누가 뭘 고치고 있어?", "이 파일 건드려도 돼?" → `python3 scripts/harness/known-issues.py show`의 이 표, 또는 `python3 scripts/harness/known-issues.py overlap <경로...>`
- PR이 main에 병합되면 행을 지운다

## 상태 바꾸기·해결 처리

- 스펙을 시작하면 상태를 `진행 중 (스펙 NNN)`으로 바꿔 바로 push한다
- **해결은 코드가 main에 들어간 뒤에** 처리한다 (PR 병합 전에 해결로 옮기면 main 코드와 목록이 어긋난다). 병합 전이면 `진행 중`으로 두고, 사용자에게 "병합 후 해결 처리"가 남았다고 알린다
- 해결: 4장 "해결됨" 표로 옮기고 (ID·해결 내용·날짜·스펙) push. 도메인 문서의 표시 줄은 브랜치 작업에서 지운다
