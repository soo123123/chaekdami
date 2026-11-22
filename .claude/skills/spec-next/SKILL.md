---
name: spec-next
description: 책다듬이 스펙의 작업 목록(tasks.md)을 이어서 구현할 때 쓴다. "스펙 004 다음 작업", "스펙 이어서 진행해", "tasks 진행해" 같은 요청.
---

# 스펙 다음 작업 진행

규칙 원문: `AGENTS.md` 3장, `docs/specs/README.md` S9~S11.

## 1. 시작 전 확인

1. `docs/specs/<번호>-*/`의 requirements·design·tasks를 읽는다
2. design 상태가 `approved` 또는 `in-progress`가 아니면 **구현하지 않는다**. 무엇이 승인 안 됐는지 알려주고 멈춘다
3. tasks.md에서 체크 안 된 첫 작업(`- [ ]`)을 고른다. ✋ 표시가 있으면 사람 확인을 요청하고 멈춘다
4. 처음 시작하는 작업이면 design·tasks 상태를 `in-progress`로 바꾸고 `docs/specs/README.md` 목록도 맞춘다

## 2. 한 작업씩 구현

- design의 "수정할 파일" 범위 안에서만 고친다
- 작업에 적힌 검증 명령을 실행한다. 없으면 `AGENTS.md` 5장에서 해당하는 것
- 끝나면 체크박스를 `- [x]`로 바꾼다. 다음 작업으로 넘어가기 전에 무엇을 했고 무엇으로 확인했는지 짧게 보고한다

## 3. 설계와 다르면 멈춘다 (S10)

요구사항·API·DB·규칙·수정 범위가 design과 달라져야 하면:

1. 구현을 멈춘다
2. 보고: 설계는 무엇인데, 실제로 무엇 때문에 안 되는지, 선택지 1)·2)와 추천
3. 사람이 방향을 주면 design 맨 아래 **변경 기록**과 tasks를 먼저 고친다 (승인 이후 문서라 hook이 확인을 요청한다)
4. 그다음 구현을 이어간다

## 4. 마지막 작업: docs 반영

- `docs/domains/*`를 지금 코드에 맞게 고친다 (구현이 끝난 뒤에만)
- 해결된 ISSUE·TODO는 `docs/known-issues.md` 4장으로 옮기고 도메인 문서의 표시 줄을 지운다
- `python3 scripts/harness/docs-check.py`, `python3 scripts/harness/contract-check.py`
- 상태를 `done`으로 바꾼다

## 하지 않는 것

- git commit·push·merge (사람이 한다. hook이 막는다). 끝나면 커밋할 파일과 `docs/conventions/git.md` 형식의 메시지를 제안한다
