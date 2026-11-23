#!/usr/bin/env python3
"""H3. 손대면 안 되는 파일을 막고, 승인된 스펙 문서 수정은 사람에게 묻는다."""
import re
from _hook import ROOT, read_input, rel_path, pre_decision

data = read_input()
ti = data.get("tool_input") or {}
path = rel_path(ti.get("file_path") or ti.get("notebook_path"))
if path is None:
    raise SystemExit(0)

name = path.rsplit("/", 1)[-1]

# 1) 자동 생성 폴더 (AGENTS.md 6장)
if re.match(r"frontend/(ios|android)/", path):
    pre_decision("deny", "frontend/ios·android 는 Expo가 만드는 폴더라 직접 고치지 않는다 (AGENTS.md 6장). 설정은 frontend/app.json 에서 바꾼다.")

# 2) 비밀값이 들어가는 파일 (AGENTS.md 7장)
if name == ".env" or name.startswith(".env.") or re.search(r"\.env\.[\w.-]*local$", name) or name.endswith(".env.local"):
    pre_decision("deny", f"{path} 는 비밀값 파일이라 AI가 쓰지 않는다 (AGENTS.md 7장). 필요한 환경변수 이름만 사용자에게 알려준다.")

# 3) known-issues 는 main 작업 공간에서만 고친다 (AGENTS.md 4장, decisions/0008)
if path == "docs/known-issues.md":
    pre_decision("deny",
        "docs/known-issues.md 는 브랜치에서 고치지 않는다 (AGENTS.md 4장). "
        "`python3 scripts/harness/known-issues.py open` 이 알려주는 .worktrees/known-issues/docs/known-issues.md 를 고치고 "
        "`python3 scripts/harness/known-issues.py push -m \"docs: 요약\"` 로 main 에 올린다.")

# 4) 승인 이후의 requirements·design 은 사람 방향이 있어야 고친다 (docs/specs/README.md S11)
m = re.match(r"docs/specs/(\d{3}-[^/]+)/(requirements|design)\.md$", path)
if m:
    target = ROOT / path
    if target.exists():
        first = target.read_text(encoding="utf-8").splitlines()[:1]
        status = first[0] if first else ""
        if re.search(r"상태:\s*\**\s*(approved|in-progress|done|superseded)", status):
            pre_decision("ask",
                f"{m.group(1)}/{m.group(2)}.md 는 승인 이후 문서다 (S11). "
                "사람이 이번 수정 방향을 줬는지 확인한다. design 이면 맨 아래 '변경 기록'에 이유를 함께 남긴다.")
