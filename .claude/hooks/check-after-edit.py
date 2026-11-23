#!/usr/bin/env python3
"""H1. 문서나 API 관련 파일을 고친 뒤 검사 스크립트를 돌려, 문제가 있을 때만 알려준다 (막지 않는다)."""
import re
import subprocess
import sys
from _hook import ROOT, read_input, rel_path, post_context

data = read_input()
path = rel_path((data.get("tool_input") or {}).get("file_path"))
if path is None:
    sys.exit(0)

KI_WT = ".worktrees/known-issues/"
if path == KI_WT + "docs/known-issues.md":
    # main 작업 공간: 그 작업 공간을 기준으로 문서 검사를 돌린다
    import os
    r = subprocess.run([sys.executable, str(ROOT / "scripts/harness/docs-check.py")], cwd=ROOT,
                       env={**os.environ, "CHAEKDAMI_ROOT": str(ROOT / KI_WT)},
                       capture_output=True, text=True, timeout=30)
    if r.returncode != 0:
        post_context("main 작업 공간의 known-issues 수정 후 docs-check(main 기준)에서 문제가 보고됐다. "
                     "이번 수정 때문에 생긴 항목이면 push 전에 고친다.\n\n" + (r.stdout + r.stderr).strip())
    sys.exit(0)
if path.startswith(".worktrees/"):
    sys.exit(0)

is_docs = path.startswith("docs/") or path in ("AGENTS.md", "CLAUDE.md", "README.md")
is_api = bool(
    re.match(r"backend/src/main/java/.+/presentation/[^/]+Controller\.java$", path)
    or re.match(r"frontend/src/.+/api/[^/]+\.ts$", path)
    or re.match(r"frontend/src/constants/.+\.ts$", path)
)
if not (is_docs or is_api):
    sys.exit(0)

def run(script):
    r = subprocess.run([sys.executable, str(ROOT / "scripts/harness" / script)],
                       cwd=ROOT, capture_output=True, text=True, timeout=30)
    return r.returncode, (r.stdout + r.stderr).strip()

reports = []
code, out = run("docs-check.py")          # API 누락 검사도 여기 들어 있어 API 파일 수정 때도 돌린다
if code != 0:
    reports.append("[docs-check 결과]\n" + out)
if is_api:
    code, out = run("contract-check.py")
    if code != 0:
        reports.append("[contract-check 결과]\n" + out)

if reports:
    post_context(
        f"{path} 수정 후 하네스 검사에서 문제가 보고됐다. 이번 수정 때문에 생긴 항목이면 작업을 마치기 전에 고친다. "
        "이미 known-issues.md 에 기록된 항목(예: TODO-1)은 그대로 둬도 된다.\n\n" + "\n\n".join(reports)
    )
