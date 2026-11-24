#!/usr/bin/env python3
"""main 에 새로 올라온 커밋이 내 작업에 어떤 영향이 있는지 알려준다 (아무것도 합치지 않는다).

  python3 scripts/harness/main-news.py              지난 확인 이후 main 에 올라온 것을 요약하고 확인 시점을 옮긴다
  python3 scripts/harness/main-news.py --all        확인 시점과 관계없이 내 브랜치가 뒤처진 만큼 전부 본다 (시점은 그대로)
    --quiet       알릴 것이 없으면 아무것도 출력하지 않는다 (세션 시작 hook 용)
    --no-fetch    origin/main 을 새로 받지 않는다
    --no-update   확인 시점을 옮기지 않는다

known-issues.md 만 바뀐 커밋은 세지 않는다 (known-issues.py news 가 알려준다).
확인 시점은 이 컴퓨터의 .git/main-news-seen 에만 저장된다 (decisions/0010).
"""
import sys
sys.dont_write_bytecode = True
import argparse
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAIN = "origin/main"
KNOWN = "docs/known-issues.md"
MAX_LIST = 6

# 여러 파트가 함께 쓰는 파일. 폴더는 끝에 / 를 붙인다.
SHARED = (
    "frontend/src/app/_layout.tsx", "frontend/src/components/", "frontend/src/constants/", "frontend/src/api/",
    "frontend/src/utils/", "frontend/package.json", "frontend/package-lock.json", "frontend/app.json",
    "backend/build.gradle", "backend/src/main/resources/",
    "backend/src/main/java/com/chaekdami/config/", "backend/src/main/java/com/chaekdami/global/",
    "AGENTS.md", "CLAUDE.md", ".claude/", ".cursor/", "scripts/harness/",
)
_BE = "backend/src/%s/java/com/chaekdami/%s/"
PARTS = [(p, _BE % (kind, d)) for kind in ("main", "test")
         for p, d in (("BE1", "reading"), ("BE2", "reward"), ("BE2", "dday"), ("BE3", "review"), ("BE3", "user"))]
PARTS += [("FE1", "frontend/src/features/fe1/"), ("FE1", "frontend/src/app/fe1/"),
          ("FE2", "frontend/src/features/fe2/"), ("FE2", "frontend/src/app/"), ("문서", "docs/")]


def git(*args):
    return subprocess.run(["git", "-c", "core.quotepath=false", *args], cwd=ROOT,
                          capture_output=True, text=True, encoding="utf-8", errors="replace")


def out(*args):
    r = git(*args)
    return r.stdout.strip() if r.returncode == 0 else ""


def names(*args):
    return set(out(*args).splitlines()) - {""}


def is_shared(path):
    return any(path.startswith(s) if s.endswith("/") else path == s for s in SHARED)


def part_of(path):
    if is_shared(path):
        return "공용"
    return next((p for p, prefix in PARTS if path.startswith(prefix)), "기타")


def short(text, n=56):
    # 본문이 제목에 붙은 커밋이 있어 " - " 앞까지만 쓴다
    text = "".join(c for c in text.split(" - ")[0] if c.isprintable())
    return text if len(text) <= n else text[:n - 1] + "…"


def listing(items):
    items = sorted(items)
    return ", ".join(items[:MAX_LIST]) + (f" … 외 {len(items) - MAX_LIST}개" if len(items) > MAX_LIST else "")


def commits(rng, *opts):
    rows = []
    for line in out("log", "--format=%H%x1f%an%x1f%P%x1f%s", *opts, rng).splitlines():
        sha, author, parents, subject = line.split("\x1f", 3)
        rows.append({"sha": sha, "author": author, "merge": len(parents.split()) > 1, "subject": subject,
                     "parent": parents.split()[0] if parents else ""})
    return rows


def files_of(c):
    return names("diff", "--name-only", c["parent"], c["sha"]) if c["parent"] else set()


def without_pr(rng):
    """main 에 PR 없이 올라온 것으로 보이는 커밋. 병합·제목으로 추정한다."""
    found = []
    for c in commits(rng, "--first-parent"):
        s = c["subject"]
        if s.startswith("Merge pull request #") or (s.split(" - ")[0].rstrip().endswith(")") and "(#" in s):
            continue
        if files_of(c) <= {KNOWN}:
            continue
        found.append(c)
    return found


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--quiet", action="store_true")
    ap.add_argument("--no-fetch", action="store_true")
    ap.add_argument("--no-update", action="store_true")
    ap.add_argument("--timeout", type=float, default=15)
    args = ap.parse_args()

    def bail(msg):
        if not args.quiet:
            print(msg)
        sys.exit(0)

    if not args.no_fetch:
        try:
            ok = subprocess.run(["git", "fetch", "-q", "origin", "main"], cwd=ROOT, capture_output=True,
                                timeout=args.timeout).returncode == 0
        except subprocess.TimeoutExpired:
            ok = False
        if not ok:
            bail("main 을 받지 못했다 (네트워크 확인). 확인을 건너뛴다.")

    head = out("rev-parse", "--verify", "-q", MAIN)
    base = out("merge-base", "HEAD", MAIN)
    if not head or not base:
        bail("origin/main 과 비교할 수 없다.")

    common = Path(out("rev-parse", "--git-common-dir"))
    seen_file = (common if common.is_absolute() else ROOT / common) / "main-news-seen"
    seen = seen_file.read_text().strip() if seen_file.exists() else ""
    if not seen or git("merge-base", "--is-ancestor", seen, head).returncode != 0:
        seen = ""  # 처음이거나 main 기록이 바뀌었으면 내 브랜치가 갈라진 곳부터 본다

    start = base if args.all or not seen else seen
    # 이미 내 브랜치에 들어온 커밋은 알리지 않는다
    news = [c for c in commits(f"{start}..{head}", "--no-merges", "^HEAD")]
    news = [c for c in news if not (files_of(c) <= {KNOWN})]

    def mark_seen():
        if not args.no_update and not args.all:
            seen_file.write_text(head + "\n")

    behind = int(out("rev-list", "--count", f"HEAD..{head}") or 0)
    if not news:
        mark_seen()
        bail(f"📭 main 에 새로 알릴 커밋 없음 (main@{head[:7]}, 내 브랜치는 {behind}개 뒤처짐)")

    branch = out("branch", "--show-current") or "(브랜치 없음)"
    print(f"📥 main 에 새 커밋 {len(news)}개 (main@{head[:7]}, 내 브랜치 {branch} 은(는) {behind}개 뒤처짐)")

    # 내가 고친 파일과 겹치는지는 '아직 안 받은 것 전체'로 본다
    incoming = names("diff", "--name-only", f"{base}", head) - {KNOWN}
    dirty = names("diff", "--name-only", "HEAD")
    untracked = names("ls-files", "--others", "--exclude-standard")
    mine = names("diff", "--name-only", base, "HEAD") | dirty | untracked
    both = incoming & mine
    print(f"  {'⚠️ 내가 고친 파일과 겹침: ' + listing(both) if both else '✅ 내가 고친 파일과 겹침 없음'}")

    r = git("merge-tree", "--write-tree", "--name-only", "--no-messages", "HEAD", head)
    if r.returncode == 1:
        print("  ⚠️ 합치면 충돌: " + listing(r.stdout.strip().splitlines()[1:]))
    elif r.returncode == 0:
        print("  ✅ 합쳐도 충돌 없음 (커밋한 것 기준. 동작이 맞는지는 따로 확인)")

    who, files = {}, set()
    for c in news:
        for f in files_of(c) - {KNOWN}:
            files.add(f)
            who.setdefault(f, set()).add(c["author"])
    shared = sorted(f for f in files if is_shared(f))
    if shared:
        print("  ⭐ 공용 파일: " + ", ".join(f"{f} ({'·'.join(sorted(who[f]))})" for f in shared[:MAX_LIST])
              + (f" … 외 {len(shared) - MAX_LIST}개" if len(shared) > MAX_LIST else ""))
    part = out("config", "--get", "chaekdami.part")
    count = Counter(part_of(f) for f in files)
    order = sorted(count, key=lambda p: (p != part, p != "공용", p))
    print("  파트별 바뀐 파일: " + " · ".join(f"{'⭐ ' if p == part else ''}{p} {count[p]}개" for p in order))
    print("  커밋:")
    for c in news[:MAX_LIST]:
        print(f"    {c['sha'][:7]} {short(c['author'], 20)}: {short(c['subject'])}")
    if len(news) > MAX_LIST:
        print(f"    … 외 {len(news) - MAX_LIST}개 (git log --oneline HEAD..{MAIN})")

    direct = [c for c in without_pr(f"{start}..{head}") if git("merge-base", "--is-ancestor", c["sha"], "HEAD").returncode]
    if direct:
        print(f"  ❗ PR 없이 올라온 것으로 보이는 커밋 {len(direct)}개 (추정): "
              + ", ".join(f"{c['sha'][:7]} {short(c['author'], 20)}" for c in direct[:MAX_LIST]))

    if dirty:
        print(f"  받기 전에 커밋하지 않은 변경 {len(dirty)}개를 먼저 커밋한다.")
    cmd = "git pull --ff-only origin main" if branch == "main" else f"git merge {MAIN}"
    print(f"  받으려면 (직접 실행): {cmd}", flush=True)
    mark_seen()  # 다 보여준 뒤에 옮긴다


if __name__ == "__main__":
    main()
