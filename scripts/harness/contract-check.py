#!/usr/bin/env python3
"""프론트가 부르는 /api 경로가 백엔드에 있는지 확인한다.

사용: python3 scripts/harness/contract-check.py [--all]
  --all   백엔드에는 있지만 프론트가 부르지 않는 API도 보여준다
  --dump  백엔드 API 목록을 JSON으로 출력하고 끝낸다
종료 코드: 프론트가 부르는데 백엔드에 없는 경로가 있으면 1
"""
import sys as _sys
_sys.dont_write_bytecode = True  # __pycache__ 를 만들지 않는다
import json
import sys
from _common import backend_endpoints, frontend_calls, normalize

def main():
    show_all = "--all" in sys.argv
    backend = backend_endpoints()
    if "--dump" in sys.argv:
        print(json.dumps(backend, ensure_ascii=False))
        return 0
    by_path = {}
    for method, path, f in backend:
        by_path.setdefault(normalize(path), set()).add(method)

    missing, method_mismatch = [], []
    called = set()
    for method, path, f in frontend_calls():
        key = normalize(path)
        if not key.startswith("/api"):
            continue
        # '/api/auth/' 처럼 접두어만 있는 상수는 건너뛴다
        if key.endswith("/api/auth") or key == "/api":
            continue
        if key not in by_path:
            missing.append((method, path, f))
        elif method != "?" and method not in by_path[key]:
            method_mismatch.append((method, path, f, sorted(by_path[key])))
        else:
            called.add((method if method != "?" else None, key))

    print(f"백엔드 API {len(backend)}개, 프론트 호출 {len(frontend_calls())}건 확인")
    if missing:
        print("\n[불일치] 프론트가 부르지만 백엔드에 없는 경로:")
        for m, p, f in missing:
            print(f"  {m:6} {p}    ({f})")
    if method_mismatch:
        print("\n[불일치] 경로는 있지만 메서드가 다름:")
        for m, p, f, ok in method_mismatch:
            print(f"  {m:6} {p}    백엔드: {','.join(ok)}    ({f})")
    if show_all:
        called_paths = {k for _, k in called}
        unused = [(m, p, f) for m, p, f in backend if normalize(p) not in called_paths]
        print(f"\n[참고] 프론트가 부르지 않는 백엔드 API {len(unused)}개:")
        for m, p, f in unused:
            print(f"  {m:6} {p}")
    if not missing and not method_mismatch:
        print("\n✅ 프론트가 부르는 경로는 모두 백엔드에 있다")
    return 1 if missing or method_mismatch else 0

if __name__ == "__main__":
    sys.exit(main())
