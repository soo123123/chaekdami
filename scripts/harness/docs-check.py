#!/usr/bin/env python3
"""docs/ 지식 베이스를 검사한다.

  1. 상태 줄: 모든 문서 첫 줄이 '> 기준:' 또는 '> 상태:'로 시작
  2. 링크: 문서 안 상대 링크의 대상 파일이 있음
  3. API 누락: 백엔드의 모든 API가 docs/domains/*/api.md 어딘가에 적혀 있음
  4. 비밀값: 키·비밀번호로 보이는 문자열이 없음
  5. 문제 ID: 문서에 쓴 ISSUE-·TODO-·ASK- ID가 known-issues.md에 있음 (열린 문제가 어느 문서에도 안 나오면 경고)

사용: python3 scripts/harness/docs-check.py
종료 코드: 문제가 하나라도 있으면 1
"""
import sys as _sys
_sys.dont_write_bytecode = True  # __pycache__ 를 만들지 않는다
import re
import sys
from _common import ROOT, backend_endpoints, normalize

DOCS = ROOT / "docs"
LINK = re.compile(r"\]\(([^)#\s]+)(#[^)]*)?\)")
SECRET = [
    re.compile(r"(?i)(password|secret|api[_-]?key)\s*[=:]\s*(?!\$\{)[A-Za-z0-9_\-]{8,}"),
    re.compile(r"\byk_live_[A-Za-z0-9]{10,}"),
    re.compile(r"\bAIza[0-9A-Za-z_\-]{20,}"),
    re.compile(r"\beyJ[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{10,}"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
]
ISSUE_ID = re.compile(r"\b((?:ISSUE-[A-Z]+|TODO|ASK)-\d+)\b")
API_ROW = re.compile(r"`((?:GET|POST|PUT|PATCH|DELETE)?\s*/[^`\s]*)`")

def main():
    files = sorted(p for p in DOCS.rglob("*.md") if "_templates" not in p.parts)
    files += [ROOT / "AGENTS.md", ROOT / "README.md"]
    problems = {"상태 줄": [], "링크": [], "API 누락": [], "비밀값": [], "문제 ID": []}
    warnings = []
    used_ids = {}

    for f in files:
        if not f.exists():
            continue
        rel = f.relative_to(ROOT).as_posix()
        text = f.read_text(encoding="utf-8")
        archived = f.is_relative_to(DOCS / "archive") and f.name != "README.md"
        if f.is_relative_to(DOCS) and not archived and not text.startswith(("> 기준:", "> 상태:")):
            problems["상태 줄"].append(rel)
        for m in LINK.finditer(re.sub(r"`[^`]*`", "", text)):
            target = m.group(1)
            if re.match(r"^[a-z]+:", target):
                continue
            if not (f.parent / target).resolve().exists():
                problems["링크"].append(f"{rel} → {target}")
        for i, line in enumerate(text.splitlines(), 1):
            if any(p.search(line) for p in SECRET):
                problems["비밀값"].append(f"{rel}:{i}")
            if f.name != "known-issues.md" and "specs" not in f.parts:
                for m in ISSUE_ID.finditer(line):
                    used_ids.setdefault(m.group(1), f"{rel}:{i}")

    documented = set()
    for api in DOCS.glob("domains/*/api.md"):
        for line in api.read_text(encoding="utf-8").splitlines():
            for m in API_ROW.finditer(line):
                documented.add(normalize(m.group(1).split()[-1]))
    for method, path, f in backend_endpoints():
        if normalize(path) not in documented:
            problems["API 누락"].append(f"{method} {path}  ({f})")

    registry = DOCS / "known-issues.md"
    defined = set()
    if registry.exists():
        for line in registry.read_text(encoding="utf-8").splitlines():
            m = re.match(r'^\|\s*(?:<a id="[^"]*"></a>)?((?:ISSUE-[A-Z]+|TODO|ASK)-\d+)\s*\|', line)
            if m:
                defined.add(m.group(1))
    for issue_id, where in sorted(used_ids.items()):
        if issue_id not in defined:
            problems["문제 ID"].append(f"{issue_id} — known-issues.md에 없음 ({where})")
    for issue_id in sorted(defined):
        if issue_id.startswith("ISSUE-") and issue_id not in used_ids:
            warnings.append(f"{issue_id} — 도메인 문서에 표시 없음")

    total = 0
    for name, items in problems.items():
        mark = "✅" if not items else "❌"
        print(f"{mark} {name}: {len(items)}건")
        for item in items:
            print(f"     {item}")
        total += len(items)
    for w in warnings:
        print(f"⚠️ 경고: {w}")
    print(f"\n문서 {len(files)}개, 백엔드 API {len(backend_endpoints())}개, 문제 ID {len(defined)}개 확인")
    return 1 if total else 0

if __name__ == "__main__":
    sys.exit(main())
