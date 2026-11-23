#!/usr/bin/env python3
"""docs/known-issues.md 를 main 에서만 고치고 바로 올린다.

known-issues 는 팀 전체가 같은 내용을 봐야 해서 기능 브랜치·PR 을 거치지 않는다.
어느 브랜치에서 작업하든 main 전용 작업 공간(.worktrees/known-issues, origin/main 기준)에서 고치고
이 스크립트로 커밋·push 한다. 이 파일 하나만 바뀐 커밋만 올린다.

  show            origin/main 을 받아 최신 known-issues 를 출력 (조회용)
  open            작업 공간을 최신 origin/main 으로 맞추고 고칠 파일 경로를 출력
  push -m 메시지   작업 공간의 known-issues 수정을 커밋해 main 에 push
                  (다른 사람이 먼저 올렸으면 받아서 다시 쌓고, ID 가 겹치면 멈춘다)
  discard         작업 공간의 수정을 버린다
  paths  --design D     design.md ③ "수정할 파일"의 경로를 "건드리는 곳" 칸 형식으로 출력
  overlap --design D [--spec NNN] | overlap 경로...
                  최신 main 의 "진행 중 작업" 표와 겹치는 곳을 출력 (자기 스펙 행은 뺀다)
  news [--quiet] [--no-update]
                  내가 마지막으로 확인한 뒤 main 의 known-issues 에서 바뀐 것(새 항목·해결·변경·진행 중 작업)을
                  요약하고, 확인 시점을 지금으로 바꾼다. 내 파트 항목을 먼저 보여준다
  part [BE1|BE2|BE3|FE1|FE2]
                  내 파트를 이 컴퓨터에만 저장 (인자 없으면 지금 값 출력)

사용 예:
  python3 scripts/harness/known-issues.py open
  (출력된 파일을 고친다)
  python3 scripts/harness/known-issues.py push -m "docs: TODO-30 완독 보상 연결 기록"
"""
import sys as _sys
_sys.dont_write_bytecode = True
import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WT = ROOT / ".worktrees" / "known-issues"
FILE = "docs/known-issues.md"
REMOTE, BRANCH = "origin", "main"
ROW_ID = re.compile(r'^\|\s*(?:<a id="([^"]*)"></a>)?((?:ISSUE-[A-Z]+|TODO|ASK)-\d+)\b')


def git(*args, cwd=ROOT, check=True):
    r = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True)
    if check and r.returncode != 0:
        sys.exit(f"git {' '.join(args)} 실패\n{(r.stdout + r.stderr).strip()}")
    return r


def fetch():
    git("fetch", "-q", REMOTE, BRANCH)


def changed_files():
    out = git("status", "--porcelain", cwd=WT).stdout
    return [line[3:] for line in out.splitlines() if line.strip()]


def validate(text):
    """ID 중복, 앵커 누락·불일치. 문제 목록을 돌려준다."""
    problems, seen = [], {}
    for i, line in enumerate(text.splitlines(), 1):
        m = ROW_ID.match(line)
        if not m:
            continue
        anchor, issue_id = m.group(1), m.group(2)
        if issue_id in seen:
            problems.append(f"{issue_id} 가 두 번 나옴 ({seen[issue_id]}행, {i}행)")
        seen.setdefault(issue_id, i)
        if anchor is not None and anchor != issue_id.lower():
            problems.append(f"{i}행 앵커 {anchor} 가 ID {issue_id} 와 다름")
    return problems


def undo_commit():
    """방금 만든 커밋을 풀어 수정 상태로 되돌린다 (올리지 못했을 때)."""
    git("reset", "-q", "--soft", "HEAD~1", cwd=WT, check=False)


def ensure_worktree():
    if not WT.exists():
        WT.parent.mkdir(parents=True, exist_ok=True)
        git("worktree", "prune")
        git("worktree", "add", "-q", "--detach", str(WT), f"{REMOTE}/{BRANCH}")


def cmd_show(_):
    fetch()
    sys.stdout.write(git("show", f"{REMOTE}/{BRANCH}:{FILE}").stdout)


def cmd_open(_):
    fetch()
    ensure_worktree()
    files = changed_files()
    if files:
        other = [f for f in files if f != FILE]
        if other:
            sys.exit(f"작업 공간에 known-issues 외 수정이 있다: {other}\n`discard` 후 다시 연다.")
        # 아직 안 올린 수정이 있으면 최신 main 위로 옮긴다
        old_head = git("rev-parse", "HEAD", cwd=WT).stdout.strip()
        git("stash", "-q", cwd=WT)
        git("checkout", "-q", "--detach", f"{REMOTE}/{BRANCH}", cwd=WT)
        if git("stash", "pop", "-q", cwd=WT, check=False).returncode != 0:
            # 충돌: 원래 자리로 되돌려 수정을 그대로 살린다
            git("reset", "-q", "--hard", cwd=WT)
            git("checkout", "-q", "--detach", old_head, cwd=WT)
            git("stash", "pop", "-q", cwd=WT)
            sys.exit("아직 올리지 않은 수정이 최신 main 과 같은 줄에서 겹친다. 수정은 그대로 두었다.\n"
                     "`show` 로 최신 내용을 보고, `discard` → `open` 후 다시 고친다.")
        print("(올리지 않은 수정을 최신 main 위로 옮겼다)")
    else:
        git("checkout", "-q", "--detach", f"{REMOTE}/{BRANCH}", cwd=WT)
    head = git("rev-parse", "--short", "HEAD", cwd=WT).stdout.strip()
    print(f"main@{head} 기준. 이 파일을 고친다:\n{WT / FILE}")


def cmd_push(args):
    if not WT.exists():
        sys.exit("작업 공간이 없다. 먼저 `open` 한다.")
    files = changed_files()
    if not files:
        sys.exit("바뀐 내용이 없다.")
    if files != [FILE]:
        sys.exit(f"known-issues.md 만 올릴 수 있다. 바뀐 파일: {files}")
    msg = args.message.strip()
    if not re.match(r"^docs: \S", msg):
        sys.exit("커밋 제목은 `docs: 요약` 형식이다 (docs/conventions/git.md).")
    problems = validate((WT / FILE).read_text(encoding="utf-8"))
    if problems:
        sys.exit("올리지 않았다. known-issues 문제:\n  " + "\n  ".join(problems))

    git("add", FILE, cwd=WT)
    git("commit", "-q", "-m", msg, cwd=WT)
    for attempt in range(3):
        r = git("push", "-q", REMOTE, f"HEAD:refs/heads/{BRANCH}", cwd=WT, check=False)
        if r.returncode == 0:
            head = git("rev-parse", "--short", "HEAD", cwd=WT).stdout.strip()
            print(f"main 에 올렸다: {head} {msg}")
            return
        # 다른 사람이 먼저 올림: 최신 main 위로 다시 쌓는다
        fetch()
        if git("rebase", "-q", f"{REMOTE}/{BRANCH}", cwd=WT, check=False).returncode != 0:
            git("rebase", "--abort", cwd=WT, check=False)
            undo_commit()
            sys.exit("다른 사람이 같은 줄을 먼저 고쳤다. 내 수정은 작업 공간에 남아 있다.\n"
                     "`show` 로 먼저 올라온 내용을 보고, `discard` → `open` 후 다시 고쳐 push 한다.")
        problems = validate((WT / FILE).read_text(encoding="utf-8"))
        if problems:
            undo_commit()
            sys.exit("다른 사람이 먼저 올린 내용과 겹친다 (번호를 다시 붙인다):\n  " + "\n  ".join(problems))
    undo_commit()
    sys.exit("push 를 3번 시도했지만 실패했다. 잠시 뒤 다시 push 한다.")


def cmd_discard(_):
    if WT.exists():
        git("rebase", "--abort", cwd=WT, check=False)
        git("reset", "-q", "--hard", cwd=WT)
        git("checkout", "-q", "--detach", f"{REMOTE}/{BRANCH}", cwd=WT)
    print("작업 공간 수정을 버렸다.")


# ---------------------------------------------------------------- 건드리는 곳 · 겹침

CODE = re.compile(r"`([^`]+)`")


def expand(raw):
    """`a/{B,C}.java` → [a/B.java, a/C.java]. 끝의 /... · /* 는 폴더로 본다."""
    p = raw.strip()
    m = re.search(r"\{([^}]*)\}", p)
    if m:
        return [x for part in m.group(1).split(",") for x in expand(p[:m.start()] + part.strip() + p[m.end():])]
    p = re.sub(r"/(\.\.\.|\*)$", "/", p)
    return [p] if "/" in p or "." in p else []


def design_paths(design):
    """design.md ③ 표 첫 칸의 경로들."""
    text = Path(design).read_text(encoding="utf-8")
    m = re.search(r"^## ③.*?$(.*?)^## ④", text, re.S | re.M)
    if not m:
        sys.exit(f"{design} 에서 '## ③ 수정할 파일' 절을 찾지 못했다.")
    paths = []
    for line in m.group(1).splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if not line.startswith("|") or not cells or set(cells[0]) <= set("-: "):
            continue
        for code in CODE.findall(cells[0]):
            for p in expand(code):
                if p not in paths:
                    paths.append(p)
    return paths


def _segs(p):
    """경로 → (저장소 루트부터인가, 알려진 마디들). `backend/.../a/B.java` 는 `...` 뒤 마디만 안다."""
    parts = [s for s in p.split("/") if s]
    if "..." in parts:
        return False, parts[len(parts) - parts[::-1].index("..."):]
    return True, parts


def _contains(seq, sub):
    return any(seq[i:i + len(sub)] == sub for i in range(len(seq) - len(sub) + 1))


def overlaps(a, b):
    """같은 파일이거나 한쪽이 다른 쪽 폴더 안에 있으면 True (경로 끝 `/` = 폴더)."""
    (fa, sa), (fb, sb) = _segs(a), _segs(b)
    if not sa or not sb:
        return False
    da, db = a.endswith("/"), b.endswith("/")
    if not da and not db:                       # 파일 ↔ 파일
        if fa and fb:
            return sa == sb
        short, long_ = (sa, sb) if len(sa) <= len(sb) else (sb, sa)
        return long_[-len(short):] == short
    if da and db:                               # 폴더 ↔ 폴더: 한쪽이 다른 쪽 안
        if fa and fb:
            n = min(len(sa), len(sb))
            return sa[:n] == sb[:n]
        return _contains(sa, sb) or _contains(sb, sa)
    folder, ff, other = (sa, fa, sb) if da else (sb, fb, sa)
    fo = fb if da else fa
    if ff and fo:                               # 폴더 ↔ 파일 (둘 다 전체 경로)
        return other[:len(folder)] == folder
    return _contains(other[:-1], folder) or _contains(other, folder)


def in_progress_rows(text):
    """'진행 중 작업' 표: [{스펙, 대상, 담당, 브랜치, 경로[]}]"""
    m = re.search(r"^## 🚧 진행 중 작업.*?$(.*?)^## ", text, re.S | re.M)
    rows = []
    if not m:
        return rows
    for line in m.group(1).splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 5 or cells[0] in ("스펙", "") or set(cells[0]) <= set("-: "):
            continue
        paths = [x for code in CODE.findall(cells[4]) for x in expand(code)]
        rows.append({"spec": cells[0], "target": cells[1], "owner": cells[2], "branch": cells[3], "paths": paths})
    return rows


def cmd_paths(args):
    print(", ".join(f"`{p}`" for p in design_paths(args.design)))


def cmd_overlap(args):
    mine = design_paths(args.design) if args.design else [x for p in args.paths for x in expand(p)]
    if not mine:
        sys.exit("비교할 경로가 없다. --design 또는 경로를 준다.")
    spec = args.spec
    if not spec and args.design:
        m = re.search(r"specs/(\d{3})-", args.design)
        spec = m.group(1) if m else None
    fetch()
    rows = in_progress_rows(git("show", f"{REMOTE}/{BRANCH}:{FILE}").stdout)
    hits = 0
    for row in rows:
        if spec and row["spec"].lstrip("0") == spec.lstrip("0"):
            continue
        same = sorted({f"{a}  ↔  {b}" for a in mine for b in row["paths"] if overlaps(a, b)})
        if same:
            hits += 1
            print(f"⚠️ 스펙 {row['spec']} ({row['target']}, {row['owner']}, {row['branch']})")
            for s in same:
                print(f"     {s}")
    if not hits:
        print(f"✅ 겹치는 진행 중 작업 없음 (진행 중 {len(rows)}건과 비교)")


# ---------------------------------------------------------------- 새 소식 (news)

PARTS = ("BE1", "BE2", "BE3", "FE1", "FE2")
SECTION_KIND = (("진행 중 작업", "progress"), ("문제", "issue"), ("할 일", "todo"),
                ("질문", "ask"), ("해결됨", "resolved"))


def _state_file(name):
    common = git("rev-parse", "--git-common-dir").stdout.strip()
    return (ROOT / common / name) if not Path(common).is_absolute() else Path(common) / name


def _my_part():
    return git("config", "--get", "chaekdami.part", check=False).stdout.strip() or None


def parse_rows(text):
    """{key: {kind, cells, headers}} — key 는 ID, 진행 중 작업은 'spec:<번호>'."""
    rows, kind, headers = {}, None, []
    for line in text.splitlines():
        if line.startswith("#"):          # 절·소절(### 기능 / ### 개선)마다 표 머리가 새로 나온다
            if line.startswith("## "):
                kind = next((k for word, k in SECTION_KIND if word in line), None)
            headers = []
            continue
        if not kind or not line.startswith("|"):
            continue
        cells = [re.sub(r'<a id="[^"]*"></a>', "", c).strip() for c in line.strip().strip("|").split("|")]
        if set(cells[0]) <= set("-: "):
            continue
        if not headers:
            headers = cells
            continue
        if kind == "progress":
            rows[f"spec:{cells[0]}"] = {"kind": kind, "cells": cells, "headers": headers}
            continue
        m = re.match(r"((?:ISSUE-[A-Z]+|TODO|ASK)-\d+)", cells[0])
        if m:
            rows[m.group(1)] = {"kind": kind, "cells": cells, "headers": headers}
    return rows


def _owner(row):
    h = row["headers"]
    for name in ("담당", "담당 파트"):
        if name in h and h.index(name) < len(row["cells"]):
            return row["cells"][h.index(name)]
    return ""


def _is_mine(row, part):
    if not part:
        return False
    owner = _owner(row)
    if part in owner:
        return True
    if "공통" in owner:
        side = "백엔드" if part.startswith("BE") else "프론트"
        return side in owner or not ("백엔드" in owner or "프론트" in owner)
    return False


def _title(row):
    h, c = row["headers"], row["cells"]
    if row["kind"] == "resolved":
        return re.sub(r"^\S+\s*", "", c[0]) or (c[1] if len(c) > 1 else "")
    for name in ("할 일", "문제", "질문", "해결"):
        if name in h and h.index(name) < len(c):
            return c[h.index(name)]
    return c[1] if len(c) > 1 else ""


def _short(s, n=70):
    s = re.sub(r"\s+", " ", s)
    return s if len(s) <= n else s[:n - 1] + "…"


def news_report(old_text, new_text, part):
    old, new = parse_rows(old_text), parse_rows(new_text)
    items = []   # (내 파트?, 줄)
    for key, row in new.items():
        before = old.get(key)
        mine = _is_mine(row, part)
        star = " ⭐ 내 파트" if mine else ""
        if row["kind"] == "progress":
            c = row["cells"]
            where = _short(", ".join(CODE.findall(c[4])) if len(c) > 4 else "", 90)
            if before is None:
                items.append((mine, f"🚧 스펙 {c[0]} 시작 ({c[1]}, {c[2]}){star} — 건드리는 곳: {where}"))
            elif before["cells"] != c:
                items.append((mine, f"🚧 스펙 {c[0]} 진행 중 작업 갱신 ({c[2]}){star} — 건드리는 곳: {where}"))
            continue
        if before is None:
            mark = "✅ 해결" if row["kind"] == "resolved" else "🆕"
            items.append((mine, f"{mark} {key} ({_owner(row) or '—'}) {_short(_title(row))}{star}"))
        elif row["kind"] == "resolved" and before["kind"] != "resolved":
            items.append((_is_mine(before, part), f"✅ 해결 {key} {_short(_title(row))}"))
        elif before["cells"] != row["cells"]:
            changed = [h for i, h in enumerate(row["headers"])
                       if i < len(row["cells"]) and (i >= len(before["cells"]) or before["cells"][i] != row["cells"][i])]
            detail = ""
            if "상태" in row["headers"]:
                i = row["headers"].index("상태")
                if i < len(before["cells"]) and before["cells"][i] != row["cells"][i]:
                    detail = f" — 상태: {before['cells'][i]} → {row['cells'][i]}"
            items.append((mine, f"✏️ {key} {_short(_title(row), 50)} — 바뀐 칸: {', '.join(changed)}{detail}{star}"))
    for key, row in old.items():
        if key not in new:
            if row["kind"] == "progress":
                items.append((_is_mine(row, part), f"🏁 스펙 {row['cells'][0]} 진행 중 작업 끝 (표에서 빠짐)"))
            else:
                star = " ⭐ 내 파트" if _is_mine(row, part) else ""
                items.append((_is_mine(row, part), f"🗑️ {key} {_short(_title(row), 50)} — 목록에서 빠짐{star}"))
    items.sort(key=lambda x: not x[0])
    return [line for _, line in items]


def cmd_part(args):
    if not args.part:
        print(_my_part() or "(정하지 않음) 예: python3 scripts/harness/known-issues.py part BE1")
        return
    part = args.part.upper()
    if part not in PARTS:
        sys.exit(f"파트는 {', '.join(PARTS)} 중 하나다.")
    git("config", "--local", "chaekdami.part", part)
    print(f"내 파트: {part} (이 컴퓨터에만 저장, 커밋되지 않음)")


def cmd_news(args):
    def bail(msg):
        if not args.quiet:
            print(msg)
        sys.exit(0)

    try:
        r = subprocess.run(["git", "fetch", "-q", REMOTE, BRANCH], cwd=ROOT, capture_output=True, text=True,
                           timeout=args.timeout)
        ok = r.returncode == 0
    except subprocess.TimeoutExpired:
        ok = False
    if not ok:
        bail("main 을 받지 못했다 (네트워크 확인). 새 소식 확인을 건너뛴다.")
    head = git("rev-parse", f"{REMOTE}/{BRANCH}", check=False).stdout.strip()
    if not head:
        bail("origin/main 이 없다.")
    seen_file = _state_file("known-issues-seen")
    seen = seen_file.read_text().strip() if seen_file.exists() else ""
    part = _my_part()
    new_text = git("show", f"{head}:{FILE}").stdout

    if not seen or git("cat-file", "-e", f"{seen}^{{commit}}", check=False).returncode != 0:
        if not args.no_update:
            seen_file.write_text(head + "\n")
        mine = [k for k, row in parse_rows(new_text).items()
                if row["kind"] in ("issue", "todo", "ask") and _is_mine(row, part)]
        msg = f"📬 known-issues 새 소식 확인을 시작한다 (기준: main@{head[:7]}). 다음부터 이후 바뀐 것만 알려준다."
        if part:
            msg += f"\n   {part} 담당 열린 항목: {len(mine)}건 ({', '.join(mine[:12])}{' …' if len(mine) > 12 else ''})"
        else:
            msg += "\n   내 파트가 정해지지 않았다. `python3 scripts/harness/known-issues.py part BE1` 처럼 정하면 내 파트를 먼저 보여준다."
        print(msg)
        return
    if seen == head:
        bail(f"📭 known-issues 새 소식 없음 (main@{head[:7]})")

    lines = news_report(git("show", f"{seen}:{FILE}", check=False).stdout, new_text, part)
    commits = git("log", "--format=%h %an: %s", f"{seen}..{head}", "--", FILE, check=False).stdout.strip().splitlines()
    if not args.no_update:
        seen_file.write_text(head + "\n")
    if not lines:
        bail(f"📭 known-issues 새 소식 없음 (main@{head[:7]})")
    print(f"📬 지난 확인(main@{seen[:7]}) 이후 known-issues 변경 {len(lines)}건 (지금 main@{head[:7]})")
    for line in lines:
        print("  " + line)
    if commits:
        print("  올린 커밋:")
        for c in commits[:5]:
            print("    " + c)
        if len(commits) > 5:
            print(f"    … 외 {len(commits) - 5}개")
    if not part:
        print("  (내 파트를 정하면 내 파트 항목을 먼저 보여준다: known-issues.py part BE1)")


def main():
    p = argparse.ArgumentParser(description="known-issues.md 를 main 에서만 고치고 바로 올린다.")
    sub = p.add_subparsers(dest="cmd", required=True)
    sp = sub.add_parser("news")
    sp.add_argument("--quiet", action="store_true", help="바뀐 것이 없거나 받지 못하면 아무것도 출력하지 않는다")
    sp.add_argument("--no-update", action="store_true", help="확인 시점을 바꾸지 않는다")
    sp.add_argument("--timeout", type=float, default=20)
    sp.set_defaults(func=cmd_news)
    sp = sub.add_parser("part")
    sp.add_argument("part", nargs="?")
    sp.set_defaults(func=cmd_part)
    sp = sub.add_parser("paths")
    sp.add_argument("--design", required=True)
    sp.set_defaults(func=cmd_paths)
    sp = sub.add_parser("overlap")
    sp.add_argument("--design")
    sp.add_argument("--spec")
    sp.add_argument("paths", nargs="*")
    sp.set_defaults(func=cmd_overlap)
    sub.add_parser("show").set_defaults(func=cmd_show)
    sub.add_parser("open").set_defaults(func=cmd_open)
    sp = sub.add_parser("push")
    sp.add_argument("-m", "--message", required=True)
    sp.set_defaults(func=cmd_push)
    sub.add_parser("discard").set_defaults(func=cmd_discard)
    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
