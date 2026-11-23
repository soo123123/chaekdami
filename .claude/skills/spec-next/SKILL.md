---
name: spec-next
description: 책다듬이 스펙의 작업 목록(tasks.md)을 이어서 구현할 때 쓴다. "스펙 004 다음 작업", "스펙 이어서 진행해", "tasks 진행해" 같은 요청.
---

# 스펙 다음 작업 진행

규칙 원문: `AGENTS.md` 3장, `docs/specs/README.md` S9~S11.

## 1. 시작 전 확인

0. `python3 scripts/harness/known-issues.py news`로 main의 known-issues 변경을 확인한다. 이 스펙의 대상 항목·관련 ASK가 바뀌었거나, 이 스펙과 겹치는 진행 중 작업이 새로 생겼으면 **구현 전에 사용자에게 알리고 방향을 받는다**. 다른 변경은 짧게 알려만 준다
1. `docs/specs/<번호>-*/`의 requirements·design·tasks를 읽는다
2. design 상태가 `approved` 또는 `in-progress`가 아니면 **구현하지 않는다**. 무엇이 승인 안 됐는지 알려주고 멈춘다
3. tasks.md에서 체크 안 된 첫 작업(`- [ ]`)을 고른다. ✋ 표시가 있으면 사람 확인을 요청하고 멈춘다
4. 처음 시작하는 작업이면 design·tasks 상태를 `in-progress`로 바꾸고 `docs/specs/README.md` 목록도 맞춘다
5. **겹침 확인**: `python3 scripts/harness/known-issues.py overlap --design <design.md>`. 겹치는 진행 중 작업이 새로 생겼으면 구현 전에 사용자에게 알리고 방향을 받는다. 이 스펙이 "🚧 진행 중 작업" 표에 없으면 new-spec 7단계대로 등록한다

## 2. 한 작업씩 구현

- design의 "수정할 파일" 범위 안에서만 고친다
- 작업에 적힌 검증 명령을 실행한다. 없으면 `AGENTS.md` 5장에서 해당하는 것
- 끝나면 체크박스를 `- [x]`로 바꾼다. 다음 작업으로 넘어가기 전에 무엇을 했고 무엇으로 확인했는지 짧게 보고한다
- **범위 확인**: 작업 하나를 끝낼 때마다 `python3 scripts/harness/known-issues.py drift`를 돌려 보고에 넣는다
  - 📌 등록 범위 밖 수정: 설계가 바뀌는 수정(새 클래스·다른 도메인·API·DB)이면 3장(S10)으로 멈춘다. 사소한 추가(테스트·상수 한두 줄)면 사용자에게 알리고 "🚧 진행 중 작업"의 건드리는 곳에 더해 push한다
  - 🔀 main에서 먼저 바뀐 내 파일: 사용자에게 알리고 main을 받아 맞출지 묻는다 (병합은 사람이 한다)

## 3. 설계와 다르면 멈춘다 (S10)

요구사항·API·DB·규칙·수정 범위가 design과 달라져야 하면:

1. 구현을 멈춘다
2. 보고: 설계는 무엇인데, 실제로 무엇 때문에 안 되는지, 선택지 1)·2)와 추천
3. 사람이 방향을 주면 design 맨 아래 **변경 기록**과 tasks를 먼저 고친다 (승인 이후 문서라 hook이 확인을 요청한다). 수정할 파일이 바뀌었으면 "🚧 진행 중 작업"의 건드리는 곳도 고쳐 push한다
4. 그다음 구현을 이어간다

## 4. 마지막 작업: docs 반영

- `docs/domains/*`를 지금 코드에 맞게 고친다 (구현이 끝난 뒤에만)
- 도메인 문서에서 해결된 ISSUE·TODO 표시 줄을 지운다. `known-issues.md` 4장 이동은 PR이 main에 병합된 뒤 issue-log 절차(main 작업 공간, `scripts/harness/known-issues.py`)로 한다. 브랜치의 `docs/known-issues.md`는 고치지 않는다
- `python3 scripts/harness/docs-check.py`, `python3 scripts/harness/contract-check.py`
- PR 전에 `python3 scripts/harness/known-issues.py drift`를 한 번 더 돌린다. 범위 밖 수정이 남아 있으면 표를 맞추고, main에서 먼저 바뀐 파일이 있으면 사용자에게 main을 받아 맞추도록 안내한다
- 상태를 `done`으로 바꾼다

## 하지 않는 것

- git commit·push·merge (사람이 한다. hook이 막는다). 끝나면 커밋할 파일과 `docs/conventions/git.md` 형식의 메시지를 제안한다
