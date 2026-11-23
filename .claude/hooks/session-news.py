#!/usr/bin/env python3
"""H4. 세션을 시작하면 main 의 known-issues 에서 지난 확인 이후 바뀐 것을 Claude 에게 알려준다 (막지 않는다).

바뀐 것이 없거나 네트워크가 안 되면 아무것도 하지 않는다. 확인 시점은 이 컴퓨터에만 저장된다 (decisions/0008).
"""
import json
import subprocess
import sys
from _hook import ROOT

try:
    r = subprocess.run([sys.executable, str(ROOT / "scripts/harness/known-issues.py"), "news", "--quiet", "--timeout", "8"],
                       cwd=ROOT, capture_output=True, text=True, timeout=15)
    out = r.stdout.strip()
except Exception:
    out = ""

if not out:
    sys.exit(0)

part_unset = "내 파트" in out and ("정해지지 않았다" in out or "정하면" in out)
guide = (
    "세션 시작 때 main 의 known-issues(문제·할 일·질문 목록)를 확인한 결과다. "
    "사용자의 첫 요청에 답하기 전에, 답변 맨 앞에서 이 변경을 짧게 알려준다 (⭐ 내 파트 항목 먼저). "
    "사용자가 지금 하려는 작업의 대상 항목·관련 질문이 바뀌었으면 그 점을 분명히 짚는다."
)
if part_unset:
    guide += " 사용자의 파트(BE1·BE2·BE3·FE1·FE2)를 한 번 물어보고 `python3 scripts/harness/known-issues.py part <파트>`로 저장한다."

print(json.dumps({"hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": guide + "\n\n" + out,
}}, ensure_ascii=False))
