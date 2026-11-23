#!/usr/bin/env python3
"""H4. 세션을 시작하면 Claude 에게 알려준다 (막지 않는다).

  1. main 의 known-issues 에서 지난 확인 이후 바뀐 것 (known-issues.py news)
  2. 지금 브랜치가 스펙 작업이면: 등록 범위 밖 수정, main 에서 먼저 바뀐 내 파일 (known-issues.py drift)

알릴 것이 없거나 네트워크가 안 되면 아무것도 하지 않는다. 확인 시점은 이 컴퓨터에만 저장된다 (decisions/0008).
"""
import json
import subprocess
import sys
from _hook import ROOT

SCRIPT = str(ROOT / "scripts/harness/known-issues.py")


def run(*args):
    try:
        r = subprocess.run([sys.executable, SCRIPT, *args], cwd=ROOT, capture_output=True, text=True, timeout=15)
        return r.stdout.strip()
    except Exception:
        return ""


news = run("news", "--quiet", "--timeout", "8")
drift = run("drift", "--quiet", "--timeout", "8")
if not news and not drift:
    sys.exit(0)

guide = ("세션 시작 때 확인한 결과다. 사용자의 첫 요청에 답하기 전에, 답변 맨 앞에서 짧게 알려준다. ")
if news:
    guide += ("known-issues 변경은 ⭐ 내 파트 항목을 먼저 말하고, 사용자가 하려는 작업의 대상 항목·관련 질문이 바뀌었으면 분명히 짚는다. ")
    if "정해지지 않았다" in news or "정하면" in news:
        guide += ("사용자의 파트(BE1·BE2·BE3·FE1·FE2)를 한 번 물어보고 "
                  "`python3 scripts/harness/known-issues.py part <파트>`로 저장한다. ")
if drift:
    guide += ("작업 범위 확인에서 범위 밖 수정이 있으면 설계 변경(S10)인지 사소한 추가인지 사용자와 정하고, "
              "main 에서 먼저 바뀐 파일이 있으면 main 을 받아 맞출지 묻는다 (병합은 사람이 한다). ")

print(json.dumps({"hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": guide + "\n\n" + "\n\n".join(x for x in (news, drift) if x),
}}, ensure_ascii=False))
