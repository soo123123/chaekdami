#!/usr/bin/env python3
"""H2. git commit · push · merge, gh pr merge 를 막는다 (AGENTS.md 7장: 사람이 한다).
예외: docs/known-issues.md 는 scripts/harness/known-issues.py 가 main 에 커밋·push 한다 (이 hook 은 그 스크립트를 막지 않는다)."""
import re
from _hook import read_input, pre_decision

data = read_input()
command = (data.get("tool_input") or {}).get("command") or ""

# git 옵션(-C 경로, -c 키=값 등) 뒤에 오는 하위 명령까지 본다. && ; | 로 이어진 명령도 각각 본다.
GIT = re.compile(r"(?:^|[;&|(]\s*|\s)git(?:\s+-[Cc]\s+\S+|\s+--?[\w-]+(?:=\S+)?)*\s+(commit|push|merge)(?![\w-])")
GH_MERGE = re.compile(r"(?:^|[;&|(]\s*|\s)gh\s+pr\s+merge\b")

m = GIT.search(command)
if m:
    pre_decision("deny",
        f"이 저장소에서 git {m.group(1)}은(는) 사람이 직접 한다 (AGENTS.md 7장). "
        "실행하지 말고, 사용자에게 실행할 명령과 커밋 메시지(docs/conventions/git.md 형식)를 안내한다. "
        "known-issues.md 수정만은 예외로 `python3 scripts/harness/known-issues.py push -m ...` 로 올린다.")
if GH_MERGE.search(command):
    pre_decision("deny", "PR 병합은 사람이 직접 한다 (AGENTS.md 7장). 병합 전 확인 결과만 보고한다.")
